import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from 'unicard-shared/src/api/supabase';
import { MobilePhotoEditor } from '../../components/MobilePhotoEditor';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AddStudentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddStudent'>;

interface StudentFormData {
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  address: string;
  photoUri?: string;
}

export const AddStudentScreen: React.FC = () => {
  const navigation = useNavigation<AddStudentScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    class: '',
    section: '',
    rollNumber: '',
    dateOfBirth: '',
    parentName: '',
    parentPhone: '',
    address: '',
  });

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, photoUri: result.assets[0].uri }));
      setShowPhotoEditor(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, photoUri: result.assets[0].uri }));
      setShowPhotoEditor(true);
    }
  };

  const handlePhotoEdit = (editedUri: string) => {
    setFormData(prev => ({ ...prev, photoUri: editedUri }));
    setShowPhotoEditor(false);
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileName = `student_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('student-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.class || !formData.rollNumber) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get school ID
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!school) throw new Error('School not found');

      // Upload photo if exists
      let photoUrl = null;
      if (formData.photoUri) {
        photoUrl = await uploadPhoto(formData.photoUri);
      }

      // Insert student data
      const { error } = await supabase
        .from('students')
        .insert({
          school_id: school.id,
          name: formData.name,
          class: formData.class,
          section: formData.section,
          roll_number: formData.rollNumber,
          date_of_birth: formData.dateOfBirth || null,
          parent_name: formData.parentName || null,
          parent_phone: formData.parentPhone || null,
          address: formData.address || null,
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Student added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  if (showPhotoEditor && formData.photoUri) {
    return (
      <MobilePhotoEditor
        imageUri={formData.photoUri}
        onSave={handlePhotoEdit}
        onCancel={() => setShowPhotoEditor(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Student</Text>
      </View>

      <View style={styles.form}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Student Photo</Text>
          {formData.photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: formData.photoUri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={() => setShowPhotoEditor(true)}
              >
                <Text style={styles.editPhotoText}>Edit Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Text style={styles.photoButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Student Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Details</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Class *"
              value={formData.class}
              onChangeText={(value) => handleInputChange('class', value)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Section"
              value={formData.section}
              onChangeText={(value) => handleInputChange('section', value)}
            />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Roll Number *"
            value={formData.rollNumber}
            onChangeText={(value) => handleInputChange('rollNumber', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Date of Birth (YYYY-MM-DD)"
            value={formData.dateOfBirth}
            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
          />
        </View>

        {/* Parent Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent Details</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Parent Name"
            value={formData.parentName}
            onChangeText={(value) => handleInputChange('parentName', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Parent Phone"
            value={formData.parentPhone}
            onChangeText={(value) => handleInputChange('parentPhone', value)}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Address"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Student</Text>
          )}
        </TouchableOpacity>
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
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  photoSection: {
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 160,
    borderRadius: 8,
    marginBottom: 10,
  },
  editPhotoButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editPhotoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  photoPlaceholder: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  photoButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});