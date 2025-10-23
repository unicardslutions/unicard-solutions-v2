import { Database } from '@nozbe/watermelondb';
import { supabase } from '../api/supabase';
import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingChanges: number;
  syncErrors: string[];
}

export interface SyncOptions {
  force?: boolean;
  tables?: string[];
  batchSize?: number;
}

class SyncService extends EventEmitter {
  private database: Database;
  private isOnline = false;
  private isSyncing = false;
  private lastSyncAt: number | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor(database: Database) {
    super();
    this.database = database;
    this.setupNetworkListener();
    this.startPeriodicSync();
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (!wasOnline && this.isOnline) {
        console.log('Network connected, starting sync...');
        this.sync();
      }
      
      this.emit('networkChange', this.isOnline);
    });
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  async sync(options: SyncOptions = {}): Promise<void> {
    if (this.isSyncing && !options.force) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!this.isOnline && !options.force) {
      console.log('Offline, skipping sync...');
      return;
    }

    try {
      this.isSyncing = true;
      this.emit('syncStart');

      console.log('Starting sync...');
      
      // Sync pending changes first
      await this.syncPendingChanges();
      
      // Sync data from server
      await this.syncFromServer(options.tables);
      
      this.lastSyncAt = Date.now();
      this.emit('syncComplete', { lastSyncAt: this.lastSyncAt });
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('syncError', error);
      
      // Schedule retry
      this.scheduleRetry();
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncPendingChanges(): Promise<void> {
    const syncQueue = this.database.get('sync_queue');
    const pendingItems = await syncQueue.query().fetch();
    
    console.log(`Syncing ${pendingItems.length} pending changes...`);
    
    for (const item of pendingItems) {
      try {
        await this.syncQueueItem(item);
        await item.destroyPermanently();
      } catch (error) {
        console.error(`Failed to sync queue item ${item.id}:`, error);
        
        // Increment retry count
        await item.update(record => {
          record.retryCount = record.retryCount + 1;
          record.lastRetryAt = Date.now();
          record.errorMessage = error.message;
        });
        
        // Remove if max retries reached
        if (item.retryCount >= item.maxRetries) {
          console.log(`Max retries reached for item ${item.id}, removing...`);
          await item.destroyPermanently();
        }
      }
    }
  }

  private async syncQueueItem(item: any): Promise<void> {
    const data = JSON.parse(item.data);
    
    switch (item.operation) {
      case 'create':
        await this.createRecord(item.tableName, data);
        break;
      case 'update':
        await this.updateRecord(item.tableName, item.recordId, data);
        break;
      case 'delete':
        await this.deleteRecord(item.tableName, item.recordId);
        break;
    }
  }

  private async createRecord(tableName: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .insert(data);
    
    if (error) throw error;
  }

  private async updateRecord(tableName: string, recordId: string, data: any): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', recordId);
    
    if (error) throw error;
  }

  private async deleteRecord(tableName: string, recordId: string): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId);
    
    if (error) throw error;
  }

  private async syncFromServer(tables?: string[]): Promise<void> {
    const tablesToSync = tables || ['students', 'orders', 'templates', 'schools', 'advertisements'];
    
    for (const tableName of tablesToSync) {
      await this.syncTable(tableName);
    }
  }

  private async syncTable(tableName: string): Promise<void> {
    console.log(`Syncing table: ${tableName}`);
    
    const localTable = this.database.get(tableName);
    const lastSync = await this.getLastSyncTime(tableName);
    
    // Get records from server
    let query = supabase.from(tableName).select('*');
    
    if (lastSync) {
      query = query.gte('updated_at', new Date(lastSync).toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`No new data for ${tableName}`);
      return;
    }
    
    // Process records
    for (const record of data) {
      await this.upsertRecord(tableName, record);
    }
    
    // Update last sync time
    await this.setLastSyncTime(tableName, Date.now());
  }

  private async upsertRecord(tableName: string, record: any): Promise<void> {
    const localTable = this.database.get(tableName);
    const existingRecord = await localTable.find(record.id);
    
    if (existingRecord) {
      await existingRecord.update(localRecord => {
        Object.keys(record).forEach(key => {
          if (key !== 'id' && localRecord._raw.hasOwnProperty(key)) {
            localRecord[key] = record[key];
          }
        });
        localRecord.syncedAt = Date.now();
        localRecord.syncStatus = 'synced';
        localRecord.syncError = null;
      });
    } else {
      await localTable.create(localRecord => {
        Object.keys(record).forEach(key => {
          if (localRecord._raw.hasOwnProperty(key)) {
            localRecord[key] = record[key];
          }
        });
        localRecord.syncedAt = Date.now();
        localRecord.syncStatus = 'synced';
      });
    }
  }

  private async getLastSyncTime(tableName: string): Promise<number | null> {
    const settings = this.database.get('user_settings');
    const setting = await settings.query(
      settings.collections.find(record => record.key === `last_sync_${tableName}`)
    ).fetch();
    
    return setting.length > 0 ? parseInt(setting[0].value) : null;
  }

  private async setLastSyncTime(tableName: string, timestamp: number): Promise<void> {
    const settings = this.database.get('user_settings');
    const existing = await settings.query(
      settings.collections.find(record => record.key === `last_sync_${tableName}`)
    ).fetch();
    
    if (existing.length > 0) {
      await existing[0].update(record => {
        record.value = timestamp.toString();
        record.updatedAt = Date.now();
      });
    } else {
      await settings.create(record => {
        record.key = `last_sync_${tableName}`;
        record.value = timestamp.toString();
        record.updatedAt = Date.now();
      });
    }
  }

  async addToSyncQueue(
    tableName: string,
    recordId: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority: number = 1
  ): Promise<void> {
    const syncQueue = this.database.get('sync_queue');
    
    await syncQueue.create(record => {
      record.tableName = tableName;
      record.recordId = recordId;
      record.operation = operation;
      record.data = JSON.stringify(data);
      record.retryCount = 0;
      record.maxRetries = this.maxRetries;
      record.createdAt = Date.now();
      record.priority = priority;
    });
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.sync();
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    this.retryTimeout = setTimeout(() => {
      if (this.isOnline) {
        this.sync();
      }
    }, this.retryDelay);
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const syncQueue = this.database.get('sync_queue');
    const pendingItems = await syncQueue.query().fetch();
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingChanges: pendingItems.length,
      syncErrors: [], // You could track errors here
    };
  }

  async clearSyncQueue(): Promise<void> {
    const syncQueue = this.database.get('sync_queue');
    const items = await syncQueue.query().fetch();
    
    for (const item of items) {
      await item.destroyPermanently();
    }
  }

  async forceSyncAll(): Promise<void> {
    await this.sync({ force: true });
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    this.removeAllListeners();
  }
}

export { SyncService };
