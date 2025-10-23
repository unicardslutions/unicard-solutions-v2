// Main exports
export * from './types';
export * from './utils/dynamicFields';
export * from './utils/validation';
export * from './api/supabase';
export * from './constants';

// Re-export commonly used types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  School,
  Student,
  Order,
  Template,
  Advertisement,
  UserRole,
  TemplateVersion,
  AppRole,
  OrderStatus,
  StudentWithOrder,
  OrderWithDetails,
  SchoolWithStats,
} from './types';

export type {
  DynamicField,
} from './utils/dynamicFields';

export type {
  StudentFormData,
  SchoolFormData,
  OrderFormData,
  TemplateFormData,
  AdvertisementFormData,
  LoginFormData,
  RegisterFormData,
  OtpFormData,
} from './utils/validation';
