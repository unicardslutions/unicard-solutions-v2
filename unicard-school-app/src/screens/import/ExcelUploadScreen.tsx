import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from 'unicard-shared/src/api/supabase';

interface ExcelData {
  [key: string]: any;
}

interface ColumnMapping {
  [key: string]: string;
}

const AVAILABLE_FIELDS = [
  'name',
  'class',
  'section',
  'roll_number',
  'date_of_birth',
  'parent_name',
  'parent_phone',
  'address',
];

export const ExcelUploadScreen: React.FC = () => {
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const pickExcelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFileName(result.assets[0].name);
        await parseExcelFile(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick Excel file');
    }
  };

  const parseExcelFile = async (fileUri: string) => {
    setLoading(true);
    try {
      // For React Native, we'll need to use a different approach
      // Since XLSX library doesn't work directly in React Native,
      // we'll simulate the parsing process
      
      // In a real implementation, you would:
      // 1. Send the file to a backend API that can parse Excel
      // 2. Or use a React Native compatible Excel parser
      
      // For now, we'll create mock data to demonstrate the UI
      const mockData = [
        { 'Student Name': 'John Doe', 'Class': '10', 'Section': 'A', 'Roll No': '001' },
        { 'Student Name': 'Jane Smith', 'Class': '10', 'Section': 'B', 'Roll No': '002' },
        { 'Student Name': 'Bob Johnson', 'Class': '11', 'Section': 'A', 'Roll No': '003' },
      ];

      setExcelData(mockData);
      
      // Auto-map columns based on common patterns
      const autoMapping: ColumnMapping = {};
      if (mockData.length > 0) {
        const headers = Object.keys(mockData[0]);
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('name')) autoMapping[header] = 'name';
          else if (lowerHeader.includes('class')) autoMapping[header] = 'class';
          else if (lowerHeader.includes('section')) autoMapping[header] = 'section';
          else if (lowerHeader.includes('roll')) autoMapping[header] = 'roll_number';
          else if (lowerHeader.includes('parent')) autoMapping[header] = 'parent_name';
          else if (lowerHeader.includes('phone')) autoMapping[header] = 'parent_phone';
          else if (lowerHeader.includes('address')) autoMapping[header] = 'address';
        });
        setColumnMapping(autoMapping);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to parse Excel file');
    } finally {
      setLoading(false);
    }
  };

  const updateColumnMapping = (excelColumn: string, field: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [excelColumn]: field,
    }));
  };

  const uploadStudents = async () => {
    if (excelData.length === 0) {
      Alert.alert('Error', 'No data to upload');
      return;
    }

    // Validate mapping
    const requiredFields = ['name', 'class', 'roll_number'];
    const mappedFields = Object.values(columnMapping);
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      Alert.alert('Validation Error', `Please map the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!school) throw new Error('School not found');

      // Transform data according to mapping
      const studentsToInsert = excelData.map(row => {
        const student: any = {
          school_id: school.id,
          created_at: new Date().toISOString(),
        };

        Object.entries(columnMapping).forEach(([excelColumn, field]) => {
          if (row[excelColumn] && field) {
            student[field] = row[excelColumn];
          }
        });

        return student;
      });

      // Insert students in batches
      const batchSize = 50;
      for (let i = 0; i < studentsToInsert.length; i += batchSize) {
        const batch = studentsToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('students')
          .insert(batch);

        if (error) throw error;
      }

      Alert.alert('Success', `${studentsToInsert.length} students uploaded successfully!`);
      setExcelData([]);
      setColumnMapping({});
      setFileName('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload students');
    } finally {
      setUploading(false);
    }
  };

  const renderColumnMapping = () => {
    if (excelData.length === 0) return null;

    const excelColumns = Object.keys(excelData[0]);

    return (
      <View style={styles.mappingContainer}>
        <Text style={styles.sectionTitle}>Map Columns</Text>
        <Text style={styles.sectionSubtitle}>
          Map Excel columns to student fields
        </Text>
        
        {excelColumns.map(column => (
          <View key={column} style={styles.mappingRow}>
            <Text style={styles.excelColumn}>{column}</Text>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.fieldSelector}>
              <TouchableOpacity
                style={styles.fieldButton}
                onPress={() => {
                  // Show field selection modal
                  Alert.alert(
                    'Select Field',
                    'Choose the field for this column',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      ...AVAILABLE_FIELDS.map(field => ({
                        text: field.replace('_', ' ').toUpperCase(),
                        onPress: () => updateColumnMapping(column, field),
                      })),
                      { text: 'Skip', onPress: () => updateColumnMapping(column, '') },
                    ]
                  );
                }}
              >
                <Text style={styles.fieldButtonText}>
                  {columnMapping[column] ? 
                    columnMapping[column].replace('_', ' ').toUpperCase() : 
                    'Select Field'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPreview = () => {
    if (excelData.length === 0) return null;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.sectionTitle}>Preview Data</Text>
        <Text style={styles.sectionSubtitle}>
          First 5 rows of your data
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.previewTable}>
            {/* Header */}
            <View style={styles.previewRow}>
              {Object.keys(excelData[0]).map(column => (
                <Text key={column} style={styles.previewHeader}>
                  {column}
                </Text>
              ))}
            </View>
            
            {/* Data rows */}
            {excelData.slice(0, 5).map((row, index) => (
              <View key={index} style={styles.previewRow}>
                {Object.values(row).map((value, colIndex) => (
                  <Text key={colIndex} style={styles.previewCell}>
                    {String(value)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Students via Excel</Text>
        <Text style={styles.subtitle}>
          Upload student data from an Excel file
        </Text>
      </View>

      <View style={styles.content}>
        {!fileName ? (
          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Select Excel File</Text>
            <Text style={styles.uploadSubtitle}>
              Choose an Excel file (.xlsx) with student data
            </Text>
            
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickExcelFile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Choose File</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>📄 {fileName}</Text>
              <Text style={styles.rowCount}>
                {excelData.length} rows found
              </Text>
            </View>

            {renderColumnMapping()}
            {renderPreview()}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setExcelData([]);
                  setColumnMapping({});
                  setFileName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={uploadStudents}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload Students</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
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
  content: {
    padding: 20,
  },
  uploadSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  fileInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  rowCount: {
    fontSize: 14,
    color: '#666',
  },
  mappingContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  excelColumn: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: '#666',
    marginHorizontal: 10,
  },
  fieldSelector: {
    flex: 1,
  },
  fieldButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
  },
  fieldButtonText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewTable: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  previewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewHeader: {
    backgroundColor: '#e5e7eb',
    padding: 10,
    fontWeight: 'bold',
    color: '#374151',
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  previewCell: {
    padding: 10,
    color: '#374151',
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});