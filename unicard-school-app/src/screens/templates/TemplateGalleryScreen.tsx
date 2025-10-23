import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from 'unicard-shared/src/api/supabase';
import { RootStackParamList } from '../../navigation/AppNavigator';

type TemplateGalleryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TemplateGallery'>;

interface Template {
  id: string;
  name: string;
  description: string;
  preview_url?: string;
  is_public: boolean;
  created_at: string;
  canvas_type: 'fabric' | 'konva';
  version: number;
}

interface Order {
  id: string;
  template_id?: string;
  status: string;
  total_students: number;
}

export const TemplateGalleryScreen: React.FC = () => {
  const navigation = useNavigation<TemplateGalleryScreenNavigationProp>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCurrentOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!school) throw new Error('School not found');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('school_id', school.id)
        .eq('status', 'draft')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentOrder(data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
      fetchCurrentOrder();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTemplates();
    fetchCurrentOrder();
  }, []);

  const selectTemplate = async (template: Template) => {
    if (!currentOrder) {
      Alert.alert('No Active Order', 'Please create an order first before selecting a template.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ template_id: template.id })
        .eq('id', currentOrder.id);

      if (error) throw error;

      setCurrentOrder(prev => prev ? { ...prev, template_id: template.id } : null);
      Alert.alert('Success', `Template "${template.name}" selected successfully!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to select template');
    } finally {
      setSubmitting(false);
    }
  };

  const requestCustomTemplate = () => {
    Alert.alert(
      'Custom Template Request',
      'Would you like to request a custom template? Our design team can create a unique template for your school.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Custom Template',
          onPress: () => {
            // In a real app, this would open a form or contact screen
            Alert.alert('Custom Template', 'Custom template request feature coming soon!');
          },
        },
      ]
    );
  };

  const renderTemplate = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => {
        setSelectedTemplate(item);
        setShowPreview(true);
      }}
    >
      <View style={styles.templateImageContainer}>
        {item.preview_url ? (
          <Image source={{ uri: item.preview_url }} style={styles.templateImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Preview</Text>
          </View>
        )}
        <View style={styles.templateOverlay}>
          <Text style={styles.canvasType}>
            {item.canvas_type.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{item.name}</Text>
        <Text style={styles.templateDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.templateVersion}>v{item.version}</Text>
      </View>

      <View style={styles.templateActions}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => {
            setSelectedTemplate(item);
            setShowPreview(true);
          }}
        >
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.selectButton,
            currentOrder?.template_id === item.id && styles.selectedButton
          ]}
          onPress={() => selectTemplate(item)}
          disabled={submitting}
        >
          <Text style={[
            styles.selectButtonText,
            currentOrder?.template_id === item.id && styles.selectedButtonText
          ]}>
            {currentOrder?.template_id === item.id ? 'Selected' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderPreviewModal = () => (
    <Modal
      visible={showPreview}
      animationType="slide"
      onRequestClose={() => setShowPreview(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedTemplate?.name}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPreview(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedTemplate?.preview_url ? (
            <Image
              source={{ uri: selectedTemplate.preview_url }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noPreviewContainer}>
              <Text style={styles.noPreviewText}>No preview available</Text>
            </View>
          )}

          <View style={styles.templateDetails}>
            <Text style={styles.detailTitle}>Description</Text>
            <Text style={styles.detailText}>{selectedTemplate?.description}</Text>
            
            <Text style={styles.detailTitle}>Canvas Type</Text>
            <Text style={styles.detailText}>
              {selectedTemplate?.canvas_type === 'fabric' ? 'Fabric.js' : 'Konva.js'}
            </Text>
            
            <Text style={styles.detailTitle}>Version</Text>
            <Text style={styles.detailText}>v{selectedTemplate?.version}</Text>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowPreview(false)}
          >
            <Text style={styles.modalCancelButtonText}>Close</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modalSelectButton}
            onPress={() => {
              if (selectedTemplate) {
                selectTemplate(selectedTemplate);
                setShowPreview(false);
              }
            }}
            disabled={submitting}
          >
            <Text style={styles.modalSelectButtonText}>
              {submitting ? 'Selecting...' : 'Select Template'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Template Gallery</Text>
        <Text style={styles.subtitle}>
          Choose a template for your ID cards
        </Text>
      </View>

      {currentOrder && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderText}>
            Current Order: {currentOrder.total_students} students
          </Text>
          {currentOrder.template_id && (
            <Text style={styles.templateSelectedText}>
              Template selected ✓
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No templates available. Check back later!
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      <TouchableOpacity
        style={styles.customTemplateButton}
        onPress={requestCustomTemplate}
      >
        <Text style={styles.customTemplateButtonText}>
          Request Custom Template
        </Text>
      </TouchableOpacity>

      {renderPreviewModal()}
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
  orderInfo: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  orderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  templateSelectedText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateImageContainer: {
    position: 'relative',
  },
  templateImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  templateOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  canvasType: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  templateInfo: {
    padding: 15,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  templateVersion: {
    fontSize: 12,
    color: '#999',
  },
  templateActions: {
    padding: 15,
    paddingTop: 0,
  },
  previewButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#10b981',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedButtonText: {
    color: '#fff',
  },
  customTemplateButton: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  customTemplateButtonText: {
    color: '#3b82f6',
    fontSize: 16,
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
  previewImage: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  noPreviewContainer: {
    height: 300,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noPreviewText: {
    color: '#666',
    fontSize: 16,
  },
  templateDetails: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
  modalSelectButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalSelectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});