import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from 'unicard-shared';
import { AuthUser } from '../services/authService';

interface DashboardScreenProps {
  user?: AuthUser;
}

interface DashboardStats {
  totalStudents: number;
  currentOrder: {
    id: string;
    status: string;
    templateSelected: boolean;
    studentsComplete: boolean;
  } | null;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    currentOrder: null,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.school?.id) return;

    try {
      setIsLoading(true);

      // Get total students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', user.school.id);

      // Get current order
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, status, template_id, total_students')
        .eq('school_id', user.school.id)
        .eq('status', 'draft')
        .single();

      // Get recent activity (placeholder)
      const recentActivity = [
        {
          id: '1',
          type: 'student',
          message: 'New student added',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'order',
          message: 'Order status updated',
          timestamp: new Date().toISOString(),
        },
      ];

      setStats({
        totalStudents: studentsCount || 0,
        currentOrder: orderData ? {
          id: orderData.id,
          status: orderData.status,
          templateSelected: !!orderData.template_id,
          studentsComplete: (orderData.total_students || 0) > 0,
        } : null,
        recentActivity,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'submitted': return '#3b82f6';
      case 'in_design': return '#f59e0b';
      case 'printed': return '#10b981';
      case 'delivered': return '#059669';
      case 'completed': return '#047857';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'in_design': return 'In Design';
      case 'printed': return 'Printed';
      case 'delivered': return 'Delivered';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
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
        <Text style={styles.welcomeText}>
          Welcome back, {user?.school?.name || 'School'}!
        </Text>
        <Text style={styles.subtitle}>
          {user?.school?.verified ? 'Verified School' : 'Pending Verification'}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="people" size={24} color="#3b82f6" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="receipt" size={24} color="#10b981" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>
              {stats.currentOrder ? '1' : '0'}
            </Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </View>
        </View>
      </View>

      {/* Current Order Status */}
      {stats.currentOrder && (
        <View style={styles.orderCard}>
          <Text style={styles.cardTitle}>Current Order</Text>
          <View style={styles.orderStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(stats.currentOrder.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusLabel(stats.currentOrder.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.orderProgress}>
            <View style={styles.progressItem}>
              <Ionicons
                name={stats.currentOrder.templateSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={stats.currentOrder.templateSelected ? '#10b981' : '#d1d5db'}
              />
              <Text style={styles.progressText}>Template Selected</Text>
            </View>
            
            <View style={styles.progressItem}>
              <Ionicons
                name={stats.currentOrder.studentsComplete ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={stats.currentOrder.studentsComplete ? '#10b981' : '#d1d5db'}
              />
              <Text style={styles.progressText}>Students Added</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="person-add" size={32} color="#3b82f6" />
            <Text style={styles.actionText}>Add Student</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="document-text" size={32} color="#10b981" />
            <Text style={styles.actionText}>Upload Excel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="images" size={32} color="#f59e0b" />
            <Text style={styles.actionText}>Upload Photos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="grid" size={32} color="#8b5cf6" />
            <Text style={styles.actionText}>Select Template</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats.recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons
                name={activity.type === 'student' ? 'person' : 'receipt'}
                size={16}
                color="#6b7280"
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityMessage}>{activity.message}</Text>
              <Text style={styles.activityTime}>
                {new Date(activity.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  orderCard: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  orderStatus: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  orderProgress: {
    gap: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 16,
    color: '#374151',
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  activityContainer: {
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
});
