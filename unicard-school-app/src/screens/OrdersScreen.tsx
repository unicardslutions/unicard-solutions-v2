import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from 'unicard-shared/src/api/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type OrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Orders'>;

interface Order {
  id: string;
  status: string;
  total_students: number;
  template_id?: string;
  created_at: string;
  updated_at: string;
  template?: {
    name: string;
    preview_url?: string;
  };
}

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalStudents: number;
}

export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!school) throw new Error('School not found');

      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          template:templates(name, preview_url)
        `)
        .eq('school_id', school.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
      const pendingOrders = ordersData?.filter(o => ['draft', 'pending', 'processing'].includes(o.status)).length || 0;
      const totalStudents = ordersData?.reduce((sum, o) => sum + (o.total_students || 0), 0) || 0;

      setStats({
        totalOrders,
        completedOrders,
        pendingOrders,
        totalStudents,
      });

      // Find current draft order
      const draftOrder = ordersData?.find(o => o.status === 'draft');
      setCurrentOrder(draftOrder || null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const submitOrder = async () => {
    if (!currentOrder) {
      Alert.alert('No Order', 'No active order to submit');
      return;
    }

    if (!currentOrder.template_id) {
      Alert.alert('No Template', 'Please select a template before submitting the order');
      return;
    }

    if (currentOrder.total_students === 0) {
      Alert.alert('No Students', 'Please add students before submitting the order');
      return;
    }

    Alert.alert(
      'Submit Order',
      `Are you sure you want to submit this order with ${currentOrder.total_students} students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error } = await supabase
                .from('orders')
                .update({ 
                  status: 'pending',
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentOrder.id);

              if (error) throw error;

              Alert.alert('Success', 'Order submitted successfully! Our team will process it soon.');
              fetchOrders(); // Refresh orders
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to submit order');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
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

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity style={styles.orderCard} key={order.id}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{order.id.slice(-8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.studentCount}>
          {order.total_students} students
        </Text>
        {order.template && (
          <Text style={styles.templateName}>
            Template: {order.template.name}
          </Text>
        )}
        <Text style={styles.orderDate}>
          Created: {new Date(order.created_at).toLocaleDateString()}
        </Text>
      </View>

      {order.status === 'completed' && (
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadButtonText}>Download Cards</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Track and manage your ID card orders</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedOrders}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
      </View>

      {/* Current Order */}
      {currentOrder && (
        <View style={styles.currentOrderContainer}>
          <Text style={styles.sectionTitle}>Current Order</Text>
          <View style={styles.currentOrderCard}>
            <View style={styles.currentOrderHeader}>
              <Text style={styles.currentOrderTitle}>
                Order #{currentOrder.id.slice(-8)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentOrder.status) }]}>
                <Text style={styles.statusText}>{getStatusText(currentOrder.status)}</Text>
              </View>
            </View>
            
            <View style={styles.currentOrderDetails}>
              <Text style={styles.detailItem}>
                Students: {currentOrder.total_students}
              </Text>
              <Text style={styles.detailItem}>
                Template: {currentOrder.template?.name || 'Not selected'}
              </Text>
            </View>

            {currentOrder.status === 'draft' && (
              <View style={styles.currentOrderActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Students')}
                >
                  <Text style={styles.actionButtonText}>Manage Students</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('TemplateGallery')}
                >
                  <Text style={styles.actionButtonText}>Select Template</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={submitOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Order History */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Order History</Text>
        {orders.length > 0 ? (
          orders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  currentOrderContainer: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  currentOrderCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentOrderTitle: {
    fontSize: 18,
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
  currentOrderDetails: {
    marginBottom: 20,
  },
  detailItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  currentOrderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContainer: {
    padding: 20,
    paddingTop: 10,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  orderDetails: {
    marginBottom: 10,
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
  downloadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});