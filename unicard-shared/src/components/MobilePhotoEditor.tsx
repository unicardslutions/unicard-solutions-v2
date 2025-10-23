import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

interface MobilePhotoEditorProps {
  imageUri: string;
  onSave: (editedImageUri: string) => void;
  onCancel: () => void;
  visible: boolean;
}

interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

export default function MobilePhotoEditor({
  imageUri,
  onSave,
  onCancel,
  visible,
}: MobilePhotoEditorProps) {
  const [currentImageUri, setCurrentImageUri] = useState(imageUri);
  const [adjustments, setAdjustments] = useState<AdjustmentState>({
    brightness: 0,
    contrast: 1,
    saturation: 1,
    hue: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'adjust' | 'filter'>('crop');
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });

  const scrollViewRef = useRef<ScrollView>(null);

  const applyAdjustments = async (newAdjustments: Partial<AdjustmentState>) => {
    try {
      setIsProcessing(true);
      const updatedAdjustments = { ...adjustments, ...newAdjustments };
      
      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [
          {
            resize: { width: 800, height: 800 },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setCurrentImageUri(result.uri);
      setAdjustments(updatedAdjustments);
    } catch (error) {
      console.error('Error applying adjustments:', error);
      Alert.alert('Error', 'Failed to apply adjustments');
    } finally {
      setIsProcessing(false);
    }
  };

  const cropImage = async () => {
    try {
      setIsProcessing(true);
      
      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [
          {
            crop: {
              originX: cropData.x,
              originY: cropData.y,
              width: cropData.width,
              height: cropData.height,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setCurrentImageUri(result.uri);
      setCropData({ x: 0, y: 0, width: 1, height: 1 });
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert('Error', 'Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  const rotateImage = async (degrees: number) => {
    try {
      setIsProcessing(true);
      
      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ rotate: degrees }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setCurrentImageUri(result.uri);
    } catch (error) {
      console.error('Error rotating image:', error);
      Alert.alert('Error', 'Failed to rotate image');
    } finally {
      setIsProcessing(false);
    }
  };

  const flipImage = async (flip: 'horizontal' | 'vertical') => {
    try {
      setIsProcessing(true);
      
      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ flip }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setCurrentImageUri(result.uri);
    } catch (error) {
      console.error('Error flipping image:', error);
      Alert.alert('Error', 'Failed to flip image');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyFilter = async (filter: string) => {
    try {
      setIsProcessing(true);
      
      let actions: ImageManipulator.Action[] = [];
      
      switch (filter) {
        case 'grayscale':
          actions = [{ grayscale: 1 }];
          break;
        case 'sepia':
          actions = [{ sepia: 1 }];
          break;
        case 'vintage':
          actions = [
            { brightness: -0.1 },
            { contrast: 0.8 },
            { saturation: 0.7 },
          ];
          break;
        case 'dramatic':
          actions = [
            { brightness: -0.2 },
            { contrast: 1.3 },
            { saturation: 1.2 },
          ];
          break;
        default:
          return;
      }

      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        actions,
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setCurrentImageUri(result.uri);
    } catch (error) {
      console.error('Error applying filter:', error);
      Alert.alert('Error', 'Failed to apply filter');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      
      // Create a final processed version
      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [
          {
            resize: { width: 400, height: 400 },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      onSave(result.uri);
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCropControls = () => (
    <View style={styles.controlsContainer}>
      <Text style={styles.controlsTitle}>Crop & Rotate</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => rotateImage(90)}
          disabled={isProcessing}
        >
          <MaterialIcons name="rotate-right" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Rotate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => flipImage('horizontal')}
          disabled={isProcessing}
        >
          <MaterialIcons name="flip" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Flip H</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => flipImage('vertical')}
          disabled={isProcessing}
        >
          <MaterialIcons name="flip" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Flip V</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAdjustControls = () => (
    <View style={styles.controlsContainer}>
      <Text style={styles.controlsTitle}>Adjustments</Text>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Brightness</Text>
        <View style={styles.sliderRow}>
          <MaterialIcons name="brightness-4" size={20} color="#666" />
          <View style={styles.slider}>
            {/* In a real implementation, you would use a proper slider component */}
            <Text style={styles.sliderValue}>{adjustments.brightness}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Contrast</Text>
        <View style={styles.sliderRow}>
          <MaterialIcons name="contrast" size={20} color="#666" />
          <View style={styles.slider}>
            <Text style={styles.sliderValue}>{adjustments.contrast}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Saturation</Text>
        <View style={styles.sliderRow}>
          <MaterialIcons name="palette" size={20} color="#666" />
          <View style={styles.slider}>
            <Text style={styles.sliderValue}>{adjustments.saturation}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFilterControls = () => (
    <View style={styles.controlsContainer}>
      <Text style={styles.controlsTitle}>Filters</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {[
            { id: 'original', name: 'Original', icon: 'image' },
            { id: 'grayscale', name: 'B&W', icon: 'filter-b-and-w' },
            { id: 'sepia', name: 'Sepia', icon: 'filter-vintage' },
            { id: 'vintage', name: 'Vintage', icon: 'filter-frames' },
            { id: 'dramatic', name: 'Dramatic', icon: 'filter-drama' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={styles.filterButton}
              onPress={() => applyFilter(filter.id)}
              disabled={isProcessing}
            >
              <MaterialIcons name={filter.icon as any} size={24} color="#007AFF" />
              <Text style={styles.filterText}>{filter.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} disabled={isProcessing}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Edit Photo</Text>
          
          <TouchableOpacity onPress={handleSave} disabled={isProcessing}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: currentImageUri }} style={styles.image} />
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'crop' && styles.activeTab]}
            onPress={() => setActiveTab('crop')}
          >
            <MaterialIcons name="crop" size={24} color={activeTab === 'crop' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'crop' && styles.activeTabText]}>
              Crop
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'adjust' && styles.activeTab]}
            onPress={() => setActiveTab('adjust')}
          >
            <MaterialIcons name="tune" size={24} color={activeTab === 'adjust' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'adjust' && styles.activeTabText]}>
              Adjust
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'filter' && styles.activeTab]}
            onPress={() => setActiveTab('filter')}
          >
            <MaterialIcons name="filter" size={24} color={activeTab === 'filter' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'filter' && styles.activeTabText]}>
              Filter
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.controlsScrollView}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'crop' && renderCropControls()}
          {activeTab === 'adjust' && renderAdjustControls()}
          {activeTab === 'filter' && renderFilterControls()}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: width - 40,
    height: height * 0.4,
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  activeTabText: {
    color: '#007AFF',
  },
  controlsScrollView: {
    backgroundColor: '#1c1c1e',
    maxHeight: height * 0.3,
  },
  controlsContainer: {
    padding: 20,
  },
  controlsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    minWidth: 80,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 5,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    backgroundColor: '#2c2c2e',
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderValue: {
    color: '#fff',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  filterButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    marginRight: 10,
    minWidth: 70,
  },
  filterText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 5,
  },
});
