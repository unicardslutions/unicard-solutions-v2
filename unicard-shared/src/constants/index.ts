// App constants
export const APP_CONFIG = {
  name: 'UniCard Solutions',
  version: '1.0.0',
  description: 'Advanced ID Card Template Builder and School Management System',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
  rembg: '/api/rembg', // Background removal API
} as const;

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  auth: {
    accessToken: 'auth_access_token',
    refreshToken: 'auth_refresh_token',
    user: 'auth_user',
    session: 'auth_session',
  },
  app: {
    theme: 'app_theme',
    language: 'app_language',
    onboarding: 'app_onboarding_completed',
    lastSync: 'app_last_sync',
  },
  cache: {
    templates: 'cache_templates',
    advertisements: 'cache_advertisements',
    schools: 'cache_schools',
  },
} as const;

// Order status configuration
export const ORDER_STATUS = {
  draft: {
    label: 'Draft',
    color: '#6B7280',
    description: 'Order is being prepared',
  },
  submitted: {
    label: 'Submitted',
    color: '#3B82F6',
    description: 'Order submitted for review',
  },
  in_design: {
    label: 'In Design',
    color: '#F59E0B',
    description: 'Cards are being designed',
  },
  printed: {
    label: 'Printed',
    color: '#10B981',
    description: 'Cards have been printed',
  },
  delivered: {
    label: 'Delivered',
    color: '#059669',
    description: 'Cards have been delivered',
  },
  completed: {
    label: 'Completed',
    color: '#047857',
    description: 'Order completed successfully',
  },
} as const;

// User roles
export const USER_ROLES = {
  admin: {
    label: 'Administrator',
    permissions: ['all'],
  },
  school: {
    label: 'School',
    permissions: ['manage_students', 'create_orders', 'view_templates'],
  },
} as const;

// Template configuration
export const TEMPLATE_CONFIG = {
  orientations: ['portrait', 'landscape'] as const,
  canvasTypes: ['konva', 'fabric'] as const,
  defaultSize: {
    portrait: { width: 300, height: 400 },
    landscape: { width: 400, height: 300 },
  },
  supportedFormats: ['png', 'jpg', 'jpeg', 'pdf'] as const,
  maxFileSize: 10 * 1024 * 1024, // 10MB
} as const;

// Photo editing configuration
export const PHOTO_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  supportedFormats: ['jpg', 'jpeg', 'png'] as const,
  thumbnailSize: 150,
  previewSize: 300,
  quality: 0.8,
} as const;

// Sync configuration
export const SYNC_CONFIG = {
  batchSize: 50,
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  backgroundSyncInterval: 5 * 60 * 1000, // 5 minutes
  maxOfflineDays: 30,
} as const;

// Validation rules
export const VALIDATION_RULES = {
  student: {
    name: { min: 1, max: 100 },
    class: { min: 1, max: 20 },
    phone: { min: 10, max: 15 },
  },
  school: {
    name: { min: 1, max: 200 },
    contact: { min: 1, max: 100 },
    address: { min: 1, max: 500 },
    phone: { min: 10, max: 15 },
  },
  password: {
    min: 6,
    max: 128,
  },
} as const;

// UI configuration
export const UI_CONFIG = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  auth: {
    invalidCredentials: 'Invalid email or password',
    sessionExpired: 'Session expired. Please login again.',
    unauthorized: 'You are not authorized to perform this action',
  },
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    minLength: 'Minimum length not met',
    maxLength: 'Maximum length exceeded',
  },
  upload: {
    fileTooLarge: 'File size is too large',
    invalidFormat: 'Invalid file format',
    uploadFailed: 'Upload failed. Please try again.',
  },
  sync: {
    failed: 'Sync failed. Please try again.',
    offline: 'You are offline. Changes will sync when online.',
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  auth: {
    login: 'Login successful',
    logout: 'Logout successful',
    register: 'Registration successful',
  },
  student: {
    created: 'Student added successfully',
    updated: 'Student updated successfully',
    deleted: 'Student deleted successfully',
  },
  order: {
    created: 'Order created successfully',
    updated: 'Order updated successfully',
    submitted: 'Order submitted successfully',
  },
  upload: {
    success: 'Upload successful',
    batchSuccess: 'Batch upload successful',
  },
  sync: {
    success: 'Sync completed successfully',
  },
} as const;
