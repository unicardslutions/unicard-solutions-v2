import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from 'unicard-shared/src/api/supabase';
import { RootStackParamList } from '../../navigation/AppNavigator';

type OrderManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderManagement'>;

interface Order {
  id: string;
  status: string;
  total_students: number;
  created_at: string;
  updated_at: string;
  school: {
    school_name: string;
    contact_person: string;
    whatsapp_number: string;
  };
  template?: {
    name: string;
    preview_url?: string;
  };
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalStudents: number;
}

export const OrderManagementScreen: React.FC = () => {
  const navigation = useNavigation<OrderManagementScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          school:schools(school_name, contact_person, whatsapp_number),
          template:templates(name, preview_url)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
      setFilteredOrders(ordersData || []);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;
      const processingOrders = ordersData?.filter(o => o.status === 'processing').length || 0;
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
      const totalStudents = ordersData?.reduce((sum, o) => sum + (o.total_students || 0), 0) || 0;

      setStats({
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalStudents,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const filterOrders = () => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.school.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.school.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    filterOrders();
  }, [searchQuery, filterStatus, orders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending': return 'Pending Review';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(-8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.schoolName}>{item.school.school_name}</Text>
        <Text style={styles.contactPerson}>{item.school.contact_person}</Text>
        <Text style={styles.phone}>{item.school.whatsapp_number}</Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.studentCount}>
          {item.total_students} students
        </Text>
        {item.template && (
          <Text style={styles.templateName}>
            Template: {item.template.name}
          </Text>
        )}
        <Text style={styles.orderDate}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.orderActions}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.processButton]}
            onPress={() => updateOrderStatus(item.id, 'processing')}
            disabled={updating}
          >
            <Text style={styles.actionButtonText}>Start Processing</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'processing' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => updateOrderStatus(item.id, 'completed')}
            disabled={updating}
          >
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton]}
            onPress={() => Alert.alert('Download', 'Download functionality coming soon!')}
          >
            <Text style={styles.actionButtonText}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={showDetails}
      animationType="slide"
      onRequestClose={() => setShowDetails(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Order Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetails(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {selectedOrder && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Order Information</Text>
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValue}>{selectedOrder.id}</Text>
              
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(selectedOrder.status) }
              ]}>
                <Text style={styles.statusIndicatorText}>
                  {getStatusText(selectedOrder.status)}
                </Text>
              </View>
              
              <Text style={styles.detailLabel}>Total Students:</Text>
              <Text style={styles.detailValue}>{selectedOrder.total_students}</Text>
              
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedOrder.created_at).toLocaleString()}
              </Text>
              
              <Text style={styles.detailLabel}>Last Updated:</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedOrder.updated_at).toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>School Information</Text>
              <Text style={styles.detailLabel}>School Name:</Text>
              <Text style={styles.detailValue}>{selectedOrder.school.school_name}</Text>
              
              <Text style={styles.detailLabel}>Contact Person:</Text>
              <Text style={styles.detailValue}>{selectedOrder.school.contact_person}</Text>
              
              <Text style={styles.detailLabel}>WhatsApp:</Text>
              <Text style={styles.detailValue}>{selectedOrder.school.whatsapp_number}</Text>
            </View>

            {selectedOrder.template && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Template Information</Text>
                <Text style={styles.detailLabel}>Template Name:</Text>
                <Text style={styles.detailValue}>{selectedOrder.template.name}</Text>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowDetails(false)}
          >
            <Text style={styles.modalCancelButtonText}>Close</Text>
          </TouchableOpacity>
          
          {selectedOrder && selectedOrder.status === 'pending' && (
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                updateOrderStatus(selectedOrder.id, 'processing');
                setShowDetails(false);
              }}
              disabled={updating}
            >
              <Text style={styles.modalActionButtonText}>
                {updating ? 'Updating...' : 'Start Processing'}
              </Text>
            </TouchableOpacity>
          )}
          
          {selectedOrder && selectedOrder.status === 'processing' && (
            <TouchableOpacity
              style={[styles.modalActionButton, styles.completeButton]}
              onPress={() => {
                updateOrderStatus(selectedOrder.id, 'completed');
                setShowDetails(false);
              }}
              disabled={updating}
            >
              <Text style={styles.modalActionButtonText}>
                {updating ? 'Updating...' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Track and manage all ID card orders</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.processingOrders}</Text>
          <Text style={styles.statLabel}>Processing</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedOrders}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'all' && styles.filterButtonTextActive
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'pending' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'pending' && styles.filterButtonTextActive
            ]}>Pending</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'processing' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('processing')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'processing' && styles.filterButtonTextActive
            ]}>Processing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'completed' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('completed')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'completed' && styles.filterButtonTextActive
            ]}>Completed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {orders.length === 0
                ? 'No orders found'
                : 'No orders match your search criteria.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />

      {renderDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  contactPerson: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  phone: {
    fontSize: 14,
    color: '#666',
  },
  orderDetails: {
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  studentCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  templateName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  processButton: {
    backgroundColor: '#3b82f6',
  },
  completeButton: {
    backgroundColor: '#10b981',
  },
  downloadButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 25,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  statusIndicator: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  statusIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalActionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
