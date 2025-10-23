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
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from 'unicard-shared/src/api/supabase';

interface PhotoFile {
  uri: string;
  name: string;
  matchedStudent?: {
    id: string;
    name: string;
    roll_number: string;
  };
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  class: string;
  section: string;
}

export const PhotoUploadScreen: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const pickZipFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFileName(result.assets[0].name);
        await extractZipFile(result.assets[0].uri);
        await fetchStudents();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick ZIP file');
    }
  };

  const extractZipFile = async (fileUri: string) => {
    setLoading(true);
    try {
      // In a real implementation, you would use a ZIP extraction library
      // For now, we'll simulate the extraction process
      
      // Mock extracted photos
      const mockPhotos: PhotoFile[] = [
        { uri: 'file://photo1.jpg', name: '001_John_Doe.jpg' },
        { uri: 'file://photo2.jpg', name: '002_Jane_Smith.jpg' },
        { uri: 'file://photo3.jpg', name: '003_Bob_Johnson.jpg' },
        { uri: 'file://photo4.jpg', name: '004_Alice_Brown.jpg' },
        { uri: 'file://photo5.jpg', name: 'unmatched_photo.jpg' },
      ];

      setPhotos(mockPhotos);
      await matchPhotosToStudents(mockPhotos);
    } catch (error) {
      Alert.alert('Error', 'Failed to extract ZIP file');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('students')
        .select('id, name, roll_number, class, section')
        .eq('school_id', user.id);

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch students');
    }
  };

  const matchPhotosToStudents = async (photoList: PhotoFile[]) => {
    const matchedPhotos = photoList.map(photo => {
      // Try to match by roll number in filename
      const rollMatch = photo.name.match(/(\d+)/);
      if (rollMatch) {
        const rollNumber = rollMatch[1];
        const student = students.find(s => s.roll_number === rollNumber);
        if (student) {
          return { ...photo, matchedStudent: student };
        }
      }

      // Try to match by name in filename
      const nameMatch = photo.name.match(/_([A-Za-z\s]+)\./);
      if (nameMatch) {
        const name = nameMatch[1].replace(/_/g, ' ').toLowerCase();
        const student = students.find(s => 
          s.name.toLowerCase().includes(name) || 
          name.includes(s.name.toLowerCase())
        );
        if (student) {
          return { ...photo, matchedStudent: student };
        }
      }

      return photo;
    });

    setPhotos(matchedPhotos);
  };

  const assignPhotoToStudent = (photoIndex: number, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setPhotos(prev => prev.map((photo, index) => 
        index === photoIndex 
          ? { ...photo, matchedStudent: student }
          : photo
      ));
    }
  };

  const uploadPhotos = async () => {
    const matchedPhotos = photos.filter(p => p.matchedStudent);
    
    if (matchedPhotos.length === 0) {
      Alert.alert('Error', 'No photos matched to students');
      return;
    }

    setUploading(true);
    try {
      // Upload photos to Supabase Storage
      for (const photo of matchedPhotos) {
        if (photo.matchedStudent) {
          // In a real implementation, you would:
          // 1. Read the actual file from the extracted ZIP
          // 2. Upload to Supabase Storage
          // 3. Update the student record with the photo URL
          
          const photoUrl = `https://example.com/photos/${photo.name}`;
          
          const { error } = await supabase
            .from('students')
            .update({ photo_url: photoUrl })
            .eq('id', photo.matchedStudent.id);

          if (error) throw error;
        }
      }

      Alert.alert('Success', `${matchedPhotos.length} photos uploaded successfully!`);
      setPhotos([]);
      setFileName('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const renderPhotoItem = ({ item, index }: { item: PhotoFile; index: number }) => (
    <View style={styles.photoItem}>
      <View style={styles.photoInfo}>
        <Text style={styles.photoName}>{item.name}</Text>
        {item.matchedStudent ? (
          <View style={styles.matchedInfo}>
            <Text style={styles.matchedText}>
              ✓ Matched to: {item.matchedStudent.name} ({item.matchedStudent.roll_number})
            </Text>
          </View>
        ) : (
          <View style={styles.unmatchedInfo}>
            <Text style={styles.unmatchedText}>⚠️ No match found</Text>
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => {
                Alert.alert(
                  'Assign to Student',
                  'Select a student for this photo',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    ...students.map(student => ({
                      text: `${student.name} (${student.roll_number})`,
                      onPress: () => assignPhotoToStudent(index, student.id),
                    })),
                  ]
                );
              }}
            >
              <Text style={styles.assignButtonText}>Assign</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const matchedCount = photos.filter(p => p.matchedStudent).length;
  const unmatchedCount = photos.length - matchedCount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Student Photos (ZIP)</Text>
        <Text style={styles.subtitle}>
          Upload a ZIP file containing student photos
        </Text>
      </View>

      <View style={styles.content}>
        {!fileName ? (
          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Select ZIP File</Text>
            <Text style={styles.uploadSubtitle}>
              Choose a ZIP file containing student photos
            </Text>
            
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickZipFile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Choose ZIP File</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>📁 {fileName}</Text>
              <Text style={styles.photoCount}>
                {photos.length} photos found
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{matchedCount}</Text>
                <Text style={styles.statLabel}>Matched</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{unmatchedCount}</Text>
                <Text style={styles.statLabel}>Unmatched</Text>
              </View>
            </View>

            <View style={styles.photosContainer}>
              <Text style={styles.sectionTitle}>Photo Matching</Text>
              <Text style={styles.sectionSubtitle}>
                Review and assign unmatched photos to students
              </Text>
              
              <FlatList
                data={photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item, index) => `${index}`}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setPhotos([]);
                  setFileName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.uploadButton, 
                  (uploading || matchedCount === 0) && styles.uploadButtonDisabled
                ]}
                onPress={uploadPhotos}
                disabled={uploading || matchedCount === 0}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.uploadButtonText}>
                    Upload {matchedCount} Photos
                  </Text>
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
  photoCount: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  photosContainer: {
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
  photoItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  matchedInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  matchedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  unmatchedInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  unmatchedText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
    marginBottom: 5,
  },
  assignButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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