import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@unicard/shared';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  canvas_type: 'konva' | 'fabric';
  version: number;
  is_active: boolean;
  created_at: string;
  usage_count: number;
  category: string;
}

export default function TemplateLibraryScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'student', name: 'Student Cards' },
    { id: 'id', name: 'ID Cards' },
    { id: 'membership', name: 'Membership' },
    { id: 'event', name: 'Event Cards' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, searchQuery]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('templates')
        .select(`
          *,
          template_versions!inner(
            id,
            version,
            is_active,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        Alert.alert('Error', 'Failed to load templates');
        return;
      }

      // Get usage count for each template
      const templatesWithUsage = await Promise.all(
        (data || []).map(async (template) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id);
          
          return {
            ...template,
            usage_count: count || 0,
          };
        })
      );

      setTemplates(templatesWithUsage);
    } catch (error) {
      console.error('Error fetching templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  };

  const handleTemplatePress = (template: Template) => {
    Alert.alert(
      template.name,
      `Canvas Type: ${template.canvas_type}\nVersion: ${template.version}\nUsage Count: ${template.usage_count}\n\nWould you like to view this template in the web editor?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open in Web', 
          onPress: () => {
            // In a real app, you would open the web app with the template ID
            Alert.alert('Info', 'This would open the web template editor');
          }
        },
      ]
    );
  };

  const renderTemplate = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => handleTemplatePress(item)}
    >
      <View style={styles.imageContainer}>
        {item.thumbnail_url ? (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.templateImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="image" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.canvasTypeBadge}>
          <Text style={styles.canvasTypeText}>
            {item.canvas_type.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.templateInfo}>
        <Text style={styles.templateName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.templateDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.templateStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="people" size={16} color="#666" />
            <Text style={styles.statText}>{item.usage_count}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="category" size={16} color="#666" />
            <Text style={styles.statText}>{item.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === item.id && styles.categoryButtonTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Template Library</Text>
        <Text style={styles.subtitle}>
          {templates.length} templates available
        </Text>
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.templatesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="image" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No templates found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or check back later
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  templatesList: {
    padding: 20,
  },
  templateCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  canvasTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  templateInfo: {
    padding: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  templateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
