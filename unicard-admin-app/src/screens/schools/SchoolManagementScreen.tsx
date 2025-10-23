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

type SchoolManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SchoolManagement'>;

interface School {
  id: string;
  school_name: string;
  contact_person: string;
  whatsapp_number: string;
  address: string;
  area: string;
  pin_code: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  student_count?: number;
  order_count?: number;
}

interface SchoolStats {
  totalSchools: number;
  verifiedSchools: number;
  pendingVerification: number;
  totalStudents: number;
}

export const SchoolManagementScreen: React.FC = () => {
  const navigation = useNavigation<SchoolManagementScreenNavigationProp>();
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<SchoolStats>({
    totalSchools: 0,
    verifiedSchools: 0,
    pendingVerification: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchSchools = async () => {
    try {
      // Fetch schools with student and order counts
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select(`
          *,
          students(count),
          orders(count)
        `)
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;

      const schoolsWithCounts = schoolsData?.map(school => ({
        ...school,
        student_count: school.students?.[0]?.count || 0,
        order_count: school.orders?.[0]?.count || 0,
      })) || [];

      setSchools(schoolsWithCounts);
      setFilteredSchools(schoolsWithCounts);

      // Calculate stats
      const totalSchools = schoolsWithCounts.length;
      const verifiedSchools = schoolsWithCounts.filter(s => s.is_verified).length;
      const pendingVerification = schoolsWithCounts.filter(s => !s.is_verified).length;
      const totalStudents = schoolsWithCounts.reduce((sum, s) => sum + s.student_count, 0);

      setStats({
        totalSchools,
        verifiedSchools,
        pendingVerification,
        totalStudents,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch schools');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchools();
  }, []);

  const filterSchools = () => {
    let filtered = schools;

    if (searchQuery) {
      filtered = filtered.filter(school =>
        school.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.area.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus === 'verified') {
      filtered = filtered.filter(school => school.is_verified);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(school => !school.is_verified);
    }

    setFilteredSchools(filtered);
  };

  useEffect(() => {
    filterSchools();
  }, [searchQuery, filterStatus, schools]);

  const verifySchool = async (schoolId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ 
          is_verified: verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', schoolId);

      if (error) throw error;

      setSchools(prev => prev.map(school => 
        school.id === schoolId 
          ? { ...school, is_verified: verified }
          : school
      ));

      Alert.alert(
        'Success', 
        `School ${verified ? 'verified' : 'unverified'} successfully`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update school status');
    }
  };

  const deleteSchool = async (schoolId: string) => {
    Alert.alert(
      'Delete School',
      'Are you sure you want to delete this school? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('schools')
                .delete()
                .eq('id', schoolId);

              if (error) throw error;

              setSchools(prev => prev.filter(s => s.id !== schoolId));
              Alert.alert('Success', 'School deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete school');
            }
          },
        },
      ]
    );
  };

  const renderSchool = ({ item }: { item: School }) => (
    <TouchableOpacity
      style={styles.schoolCard}
      onPress={() => {
        setSelectedSchool(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.schoolHeader}>
        <Text style={styles.schoolName}>{item.school_name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_verified ? '#10b981' : '#f59e0b' }
        ]}>
          <Text style={styles.statusText}>
            {item.is_verified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.schoolInfo}>
        <Text style={styles.contactPerson}>{item.contact_person}</Text>
        <Text style={styles.area}>{item.area}, {item.pin_code}</Text>
        <Text style={styles.phone}>{item.whatsapp_number}</Text>
      </View>

      <View style={styles.schoolStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.student_count}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.order_count}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <Text style={styles.createdDate}>
          Joined: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.schoolActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.is_verified ? styles.unverifyButton : styles.verifyButton
          ]}
          onPress={() => verifySchool(item.id, !item.is_verified)}
        >
          <Text style={styles.actionButtonText}>
            {item.is_verified ? 'Unverify' : 'Verify'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteSchool(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
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
          <Text style={styles.modalTitle}>School Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetails(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {selectedSchool && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>School Information</Text>
              <Text style={styles.detailLabel}>School Name:</Text>
              <Text style={styles.detailValue}>{selectedSchool.school_name}</Text>
              
              <Text style={styles.detailLabel}>Contact Person:</Text>
              <Text style={styles.detailValue}>{selectedSchool.contact_person}</Text>
              
              <Text style={styles.detailLabel}>WhatsApp Number:</Text>
              <Text style={styles.detailValue}>{selectedSchool.whatsapp_number}</Text>
              
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{selectedSchool.address}</Text>
              
              <Text style={styles.detailLabel}>Area:</Text>
              <Text style={styles.detailValue}>{selectedSchool.area}</Text>
              
              <Text style={styles.detailLabel}>Pin Code:</Text>
              <Text style={styles.detailValue}>{selectedSchool.pin_code}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Statistics</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxNumber}>{selectedSchool.student_count}</Text>
                  <Text style={styles.statBoxLabel}>Students</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxNumber}>{selectedSchool.order_count}</Text>
                  <Text style={styles.statBoxLabel}>Orders</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Status</Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: selectedSchool.is_verified ? '#10b981' : '#f59e0b' }
              ]}>
                <Text style={styles.statusIndicatorText}>
                  {selectedSchool.is_verified ? 'Verified' : 'Pending Verification'}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowDetails(false)}
          >
            <Text style={styles.modalCancelButtonText}>Close</Text>
          </TouchableOpacity>
          
          {selectedSchool && (
            <TouchableOpacity
              style={[
                styles.modalActionButton,
                selectedSchool.is_verified ? styles.unverifyButton : styles.verifyButton
              ]}
              onPress={() => {
                verifySchool(selectedSchool.id, !selectedSchool.is_verified);
                setShowDetails(false);
              }}
            >
              <Text style={styles.modalActionButtonText}>
                {selectedSchool.is_verified ? 'Unverify' : 'Verify'}
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
        <Text style={styles.loadingText}>Loading schools...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>School Management</Text>
        <Text style={styles.subtitle}>Manage school registrations and verification</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalSchools}</Text>
          <Text style={styles.statLabel}>Total Schools</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.verifiedSchools}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingVerification}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools..."
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
              filterStatus === 'verified' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('verified')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'verified' && styles.filterButtonTextActive
            ]}>Verified</Text>
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
        </View>
      </View>

      {/* Schools List */}
      <FlatList
        data={filteredSchools}
        renderItem={renderSchool}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {schools.length === 0
                ? 'No schools found'
                : 'No schools match your search criteria.'}
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  schoolCard: {
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
  schoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
  schoolInfo: {
    marginBottom: 15,
  },
  contactPerson: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  area: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  phone: {
    fontSize: 14,
    color: '#666',
  },
  schoolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
  },
  schoolActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#10b981',
  },
  unverifyButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  statBoxNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 5,
  },
  statBoxLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusIndicatorText: {
    color: '#fff',
    fontSize: 16,
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
