import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../api/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  type: 'order_update' | 'school_verification' | 'advertisement' | 'general';
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID,
        });
        this.expoPushToken = token.data;
        
        // Register token with Supabase
        await this.registerTokenWithSupabase();
      } else {
        console.warn('Must use physical device for push notifications');
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private async createNotificationChannels(): Promise<void> {
    const channels = [
      {
        name: 'Order Updates',
        description: 'Notifications about order status changes',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      },
      {
        name: 'School Verification',
        description: 'Notifications about school verification status',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      },
      {
        name: 'Advertisements',
        description: 'Advertisement notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      },
      {
        name: 'General',
        description: 'General app notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.name, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: channel.sound,
      });
    }
  }

  private async registerTokenWithSupabase(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          expo_push_token: this.expoPushToken,
          platform: Platform.OS,
          device_id: Device.osInternalBuildId || 'unknown',
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error registering push token:', error);
      }
    } catch (error) {
      console.error('Error registering push token with Supabase:', error);
    }
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // You can handle the notification here, e.g., update UI state
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // Handle navigation based on notification data
      this.handleNotificationTap(response);
    });
  }

  private handleNotificationTap(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'order_update' && data?.order_id) {
      // Navigate to order details
      console.log('Navigate to order:', data.order_id);
    } else if (data?.type === 'school_verification' && data?.school_id) {
      // Navigate to school details
      console.log('Navigate to school:', data.school_id);
    }
    // Add more navigation logic as needed
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      const channelId = this.getChannelId(notification.type);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: null, // Show immediately
        ...(Platform.OS === 'android' && { channelId }),
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  async sendPushNotification(
    userIds: string[],
    notification: NotificationData
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: userIds,
          notification: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            type: notification.type,
          },
        },
      });

      if (error) {
        console.error('Error sending push notification:', error);
      }
    } catch (error) {
      console.error('Error calling push notification function:', error);
    }
  }

  async sendNotificationToSchool(schoolId: string, notification: NotificationData): Promise<void> {
    try {
      // Get all users from the school
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('school_id', schoolId);

      if (error) {
        console.error('Error fetching school users:', error);
        return;
      }

      if (users && users.length > 0) {
        const userIds = users.map(user => user.id);
        await this.sendPushNotification(userIds, notification);
      }
    } catch (error) {
      console.error('Error sending notification to school:', error);
    }
  }

  async sendNotificationToAdmins(notification: NotificationData): Promise<void> {
    try {
      // Get all admin users
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) {
        console.error('Error fetching admin users:', error);
        return;
      }

      if (admins && admins.length > 0) {
        const userIds = admins.map(admin => admin.id);
        await this.sendPushNotification(userIds, notification);
      }
    } catch (error) {
      console.error('Error sending notification to admins:', error);
    }
  }

  private getChannelId(type: string): string {
    switch (type) {
      case 'order_update':
        return 'Order Updates';
      case 'school_verification':
        return 'School Verification';
      case 'advertisement':
        return 'Advertisements';
      default:
        return 'General';
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    return this.expoPushToken;
  }

  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  async scheduleReminderNotification(
    title: string,
    body: string,
    triggerDate: Date,
    data?: any
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: triggerDate,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
