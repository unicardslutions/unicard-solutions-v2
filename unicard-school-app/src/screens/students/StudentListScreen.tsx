import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from 'unicard-shared/src/api/supabase';
import { RootStackParamList } from '../../navigation/AppNavigator';

type StudentListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'StudentList'>;

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  roll_number: string;
  photo_url?: string;
  created_at: string;
}

export const StudentListScreen: React.FC = () => {
  const navigation = useNavigation<StudentListScreenNavigationProp>();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, []);

  const filterStudents = () => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterClass) {
      filtered = filtered.filter(student => student.class === filterClass);
    }

    if (filterSection) {
      filtered = filtered.filter(student => student.section === filterSection);
    }

    setFilteredStudents(filtered);
  };

  useEffect(() => {
    filterStudents();
  }, [searchQuery, filterClass, filterSection, students]);

  const deleteStudent = async (studentId: string) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId);

              if (error) throw error;

              setStudents(prev => prev.filter(s => s.id !== studentId));
              Alert.alert('Success', 'Student deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete student');
            }
          },
        },
      ]
    );
  };

  const editStudent = (student: Student) => {
    // Navigate to edit screen (you can implement this later)
    Alert.alert('Edit Student', `Edit functionality for ${student.name} - Coming Soon`);
  };

  const getUniqueClasses = () => {
    const classes = [...new Set(students.map(s => s.class))].sort();
    return classes;
  };

  const getUniqueSections = () => {
    const sections = [...new Set(students.map(s => s.section))].sort();
    return sections;
  };

  const renderStudent = ({ item }: { item: Student }) => (
    <TouchableOpacity style={styles.studentCard}>
      <View style={styles.studentInfo}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.studentPhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentClass}>
            Class {item.class} {item.section && `- Section ${item.section}`}
          </Text>
          <Text style={styles.rollNumber}>Roll: {item.roll_number}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editStudent(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteStudent(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Students ({filteredStudents.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddStudent')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterRow}>
          <TextInput
            style={[styles.filterInput, styles.halfInput]}
            placeholder="Filter by class"
            value={filterClass}
            onChangeText={setFilterClass}
          />
          <TextInput
            style={[styles.filterInput, styles.halfInput]}
            placeholder="Filter by section"
            value={filterSection}
            onChangeText={setFilterSection}
          />
        </View>

        {(filterClass || filterSection || searchQuery) && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSearchQuery('');
              setFilterClass('');
              setFilterSection('');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {students.length === 0
                ? 'No students found. Add your first student!'
                : 'No students match your search criteria.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#3b82f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  halfInput: {
    width: '48%',
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  clearFiltersText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  studentCard: {
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#3b82f6',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});