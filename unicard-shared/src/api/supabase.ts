import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Environment variables - these will be set by the consuming app
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

// Create Supabase client with platform-appropriate storage
const getStorage = () => {
  // For React Native, use AsyncStorage
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    // React Native environment
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  }
  // Web environment
  return localStorage;
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getStorage(),
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from '../types';
