import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PhotoUploadScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>Photo Upload Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
