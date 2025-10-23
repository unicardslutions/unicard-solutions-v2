import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

interface MobilePhotoEditorProps {
  imageUri: string;
  onSave: (editedUri: string) => void;
  onCancel: () => void;
}

export const MobilePhotoEditor: React.FC<MobilePhotoEditorProps> = ({
  imageUri,
  onSave,
  onCancel,
}) => {
  const [currentUri, setCurrentUri] = useState(imageUri);
  const [loading, setLoading] = useState(false);

  const manipulateImage = async (actions: ImageManipulator.Action[]) => {
    setLoading(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        actions,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentUri(result.uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to edit image');
    } finally {
      setLoading(false);
    }
  };

  const handleCrop = () => {
    // For now, we'll use a simple crop. In a real app, you'd use a more sophisticated crop library
    manipulateImage([
      { crop: { originX: 0, originY: 0, width: 0.8, height: 0.8 } }
    ]);
  };

  const handleRotate = () => {
    manipulateImage([{ rotate: 90 }]);
  };

  const handleFlip = () => {
    manipulateImage([{ flip: ImageManipulator.FlipType.Horizontal }]);
  };

  const handleBrightness = (value: number) => {
    manipulateImage([{ brightness: value }]);
  };

  const handleContrast = (value: number) => {
    manipulateImage([{ contrast: value }]);
  };

  const handleSave = () => {
    onSave(currentUri);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.button}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Photo</Text>
        <TouchableOpacity onPress={handleSave} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: currentUri }} style={styles.image} />
      </View>

      <View style={styles.toolsContainer}>
        <View style={styles.toolRow}>
          <TouchableOpacity style={styles.toolButton} onPress={handleCrop}>
            <Text style={styles.toolButtonText}>Crop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={handleRotate}>
            <Text style={styles.toolButtonText}>Rotate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={handleFlip}>
            <Text style={styles.toolButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toolRow}>
          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={() => handleBrightness(0.2)}
          >
            <Text style={styles.toolButtonText}>Brighter</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={() => handleBrightness(-0.2)}
          >
            <Text style={styles.toolButtonText}>Darker</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={() => handleContrast(0.2)}
          >
            <Text style={styles.toolButtonText}>Contrast+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: width - 40,
    height: (width - 40) * 1.33, // 3:4 aspect ratio
    borderRadius: 8,
  },
  toolsContainer: {
    backgroundColor: '#1f2937',
    padding: 20,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  toolButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  toolButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
