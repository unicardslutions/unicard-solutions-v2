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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from 'unicard-shared/src/api/supabase';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AdvertisementManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdvertisementManagement'>;

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  link_url?: string;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

interface AdvertisementForm {
  title: string;
  description: string;
  image_url?: string;
  link_url: string;
  is_active: boolean;
  position: number;
}

export const AdvertisementManagementScreen: React.FC = () => {
  const navigation = useNavigation<AdvertisementManagementScreenNavigationProp>();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdvertisementForm>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
    position: 1,
  });
  const [uploading, setUploading] = useState(false);

  const fetchAdvertisements = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch advertisements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdvertisements();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, image_url: result.assets[0].uri }));
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileName = `ad_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('advertisements')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('advertisements')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if it's a local URI
      if (imageUrl && imageUrl.startsWith('file://')) {
        imageUrl = await uploadImage(imageUrl);
        if (!imageUrl) {
          Alert.alert('Error', 'Failed to upload image');
          return;
        }
      }

      const adData = {
        ...formData,
        image_url: imageUrl,
      };

      if (editingAd) {
        // Update existing advertisement
        const { error } = await supabase
          .from('advertisements')
          .update({
            ...adData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAd.id);

        if (error) throw error;

        setAdvertisements(prev => prev.map(ad => 
          ad.id === editingAd.id 
            ? { ...ad, ...adData, updated_at: new Date().toISOString() }
            : ad
        ));

        Alert.alert('Success', 'Advertisement updated successfully!');
      } else {
        // Create new advertisement
        const { data, error } = await supabase
          .from('advertisements')
          .insert({
            ...adData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        setAdvertisements(prev => [data, ...prev]);
        Alert.alert('Success', 'Advertisement created successfully!');
      }

      setShowForm(false);
      setEditingAd(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        is_active: true,
        position: 1,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save advertisement');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      is_active: ad.is_active,
      position: ad.position,
    });
    setShowForm(true);
  };

  const handleDelete = async (adId: string) => {
    Alert.alert(
      'Delete Advertisement',
      'Are you sure you want to delete this advertisement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('advertisements')
                .delete()
                .eq('id', adId);

              if (error) throw error;

              setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
              Alert.alert('Success', 'Advertisement deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete advertisement');
            }
          },
        },
      ]
    );
  };

  const toggleActive = async (adId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ 
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', adId);

      if (error) throw error;

      setAdvertisements(prev => prev.map(ad => 
        ad.id === adId 
          ? { ...ad, is_active: !isActive, updated_at: new Date().toISOString() }
          : ad
      ));

      Alert.alert('Success', `Advertisement ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update advertisement status');
    }
  };

  const renderAdvertisement = ({ item }: { item: Advertisement }) => (
    <View style={styles.adCard}>
      <View style={styles.adHeader}>
        <Text style={styles.adTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_active ? '#10b981' : '#6b7280' }
        ]}>
          <Text style={styles.statusText}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.adImage} />
      )}

      <Text style={styles.adDescription} numberOfLines={3}>
        {item.description}
      </Text>

      {item.link_url && (
        <Text style={styles.adLink} numberOfLines={1}>
          Link: {item.link_url}
        </Text>
      )}

      <Text style={styles.adPosition}>
        Position: {item.position}
      </Text>

      <View style={styles.adActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.is_active ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => toggleActive(item.id, item.is_active)}
        >
          <Text style={styles.actionButtonText}>
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => (
    <Modal
      visible={showForm}
      animationType="slide"
      onRequestClose={() => setShowForm(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowForm(false);
              setEditingAd(null);
              setFormData({
                title: '',
                description: '',
                image_url: '',
                link_url: '',
                is_active: true,
                position: 1,
              });
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <TextInput
            style={styles.input}
            placeholder="Title *"
            value={formData.title}
            onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description *"
            value={formData.description}
            onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
            multiline
            numberOfLines={4}
          />

          <TextInput
            style={styles.input}
            placeholder="Link URL (optional)"
            value={formData.link_url}
            onChangeText={(value) => setFormData(prev => ({ ...prev, link_url: value }))}
            keyboardType="url"
          />

          <TextInput
            style={styles.input}
            placeholder="Position"
            value={formData.position.toString()}
            onChangeText={(value) => setFormData(prev => ({ ...prev, position: parseInt(value) || 1 }))}
            keyboardType="numeric"
          />

          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Advertisement Image</Text>
            
            {formData.image_url ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: formData.image_url }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={pickImage}
                >
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
                <Text style={styles.pickImageText}>Pick Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.toggleSection}>
            <Text style={styles.toggleLabel}>Active Status</Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.is_active && styles.toggleButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            >
              <Text style={[
                styles.toggleButtonText,
                formData.is_active && styles.toggleButtonTextActive
              ]}>
                {formData.is_active ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowForm(false)}
          >
            <Text style={styles.modalCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalSaveButton, uploading && styles.modalSaveButtonDisabled]}
            onPress={handleSubmit}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.modalSaveButtonText}>
                {editingAd ? 'Update' : 'Create'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading advertisements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Advertisement Management</Text>
        <Text style={styles.subtitle}>Manage promotional content for school dashboards</Text>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.createButtonText}>+ Create Advertisement</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={advertisements}
        renderItem={renderAdvertisement}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No advertisements found. Create your first advertisement!
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />

      {renderForm()}
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
  actionBar: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  adCard: {
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
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adTitle: {
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
  adImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  adDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  adLink: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 5,
  },
  adPosition: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  adActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  deactivateButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
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
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  imageContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  changeImageButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeImageText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pickImageButton: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  pickImageText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  toggleButtonActive: {
    backgroundColor: '#10b981',
  },
  toggleButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
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
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

