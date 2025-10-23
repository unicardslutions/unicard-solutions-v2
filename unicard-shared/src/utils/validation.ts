import { z } from 'zod';

// Student validation schemas
export const studentSchema = z.object({
  student_name: z.string().min(1, 'Student name is required').max(100),
  father_name: z.string().optional(),
  class: z.string().min(1, 'Class is required').max(20),
  section: z.string().optional(),
  roll_number: z.string().optional(),
  student_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  phone_number: z.string().optional(),
  blood_group: z.string().optional(),
  photo_url: z.string().url().optional(),
});

export const studentInsertSchema = studentSchema.extend({
  order_id: z.string().uuid(),
});

export const studentUpdateSchema = studentSchema.partial().extend({
  id: z.string().uuid(),
});

// School validation schemas
export const schoolSchema = z.object({
  school_name: z.string().min(1, 'School name is required').max(200),
  contact_person: z.string().min(1, 'Contact person is required').max(100),
  address: z.string().min(1, 'Address is required').max(500),
  whatsapp_number: z.string().min(10, 'Valid WhatsApp number is required').max(15),
  area: z.string().optional(),
  pin_code: z.string().optional(),
  logo_url: z.string().url().optional(),
  contact_photo_url: z.string().url().optional(),
});

export const schoolInsertSchema = schoolSchema.extend({
  user_id: z.string().uuid(),
  verified: z.boolean().default(false),
});

export const schoolUpdateSchema = schoolSchema.partial().extend({
  id: z.string().uuid(),
});

// Order validation schemas
export const orderSchema = z.object({
  school_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  total_students: z.number().min(0),
  notes: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'in_design', 'printed', 'delivered', 'completed']).default('draft'),
});

export const orderInsertSchema = orderSchema;

export const orderUpdateSchema = orderSchema.partial().extend({
  id: z.string().uuid(),
});

// Template validation schemas
export const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().optional(),
  orientation: z.enum(['portrait', 'landscape']),
  design_data: z.any(), // JSON object
  is_public: z.boolean().default(false),
  thumbnail_url: z.string().url().optional(),
  canvas_type: z.enum(['konva', 'fabric']).default('konva'),
  version: z.number().min(1).default(1),
  parent_template_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export const templateInsertSchema = templateSchema.extend({
  created_by: z.string().uuid().optional(),
});

export const templateUpdateSchema = templateSchema.partial().extend({
  id: z.string().uuid(),
});

// Advertisement validation schemas
export const advertisementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  image_url: z.string().url('Valid image URL is required'),
  link_url: z.string().url().optional(),
  display_order: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const advertisementInsertSchema = advertisementSchema.extend({
  created_by: z.string().uuid().optional(),
});

export const advertisementUpdateSchema = advertisementSchema.partial().extend({
  id: z.string().uuid(),
});

// User role validation schemas
export const userRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'school']),
});

export const userRoleInsertSchema = userRoleSchema;

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  school_name: z.string().min(1, 'School name is required'),
  contact_person: z.string().min(1, 'Contact person is required'),
  address: z.string().min(1, 'Address is required'),
  whatsapp_number: z.string().min(10, 'Valid WhatsApp number is required'),
  area: z.string().optional(),
  pin_code: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const otpSchema = z.object({
  email: z.string().email('Valid email is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// File upload validation schemas
export const photoUploadSchema = z.object({
  file: z.any(), // File object
  student_id: z.string().uuid().optional(),
});

export const excelUploadSchema = z.object({
  file: z.any(), // File object
  order_id: z.string().uuid(),
  column_mapping: z.record(z.string(), z.string()),
});

export const zipUploadSchema = z.object({
  file: z.any(), // File object
  order_id: z.string().uuid(),
});

// Search and filter schemas
export const studentFilterSchema = z.object({
  search: z.string().optional(),
  class: z.string().optional(),
  section: z.string().optional(),
  order_id: z.string().uuid().optional(),
});

export const schoolFilterSchema = z.object({
  search: z.string().optional(),
  verified: z.boolean().optional(),
  area: z.string().optional(),
});

export const orderFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'in_design', 'printed', 'delivered', 'completed']).optional(),
  school_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export const templateFilterSchema = z.object({
  search: z.string().optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  canvas_type: z.enum(['konva', 'fabric']).optional(),
  is_public: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Export types
export type StudentFormData = z.infer<typeof studentSchema>;
export type StudentInsertData = z.infer<typeof studentInsertSchema>;
export type StudentUpdateData = z.infer<typeof studentUpdateSchema>;

export type SchoolFormData = z.infer<typeof schoolSchema>;
export type SchoolInsertData = z.infer<typeof schoolInsertSchema>;
export type SchoolUpdateData = z.infer<typeof schoolUpdateSchema>;

export type OrderFormData = z.infer<typeof orderSchema>;
export type OrderInsertData = z.infer<typeof orderInsertSchema>;
export type OrderUpdateData = z.infer<typeof orderUpdateSchema>;

export type TemplateFormData = z.infer<typeof templateSchema>;
export type TemplateInsertData = z.infer<typeof templateInsertSchema>;
export type TemplateUpdateData = z.infer<typeof templateUpdateSchema>;

export type AdvertisementFormData = z.infer<typeof advertisementSchema>;
export type AdvertisementInsertData = z.infer<typeof advertisementInsertSchema>;
export type AdvertisementUpdateData = z.infer<typeof advertisementUpdateSchema>;

export type UserRoleFormData = z.infer<typeof userRoleSchema>;
export type UserRoleInsertData = z.infer<typeof userRoleInsertSchema>;

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;

export type PhotoUploadData = z.infer<typeof photoUploadSchema>;
export type ExcelUploadData = z.infer<typeof excelUploadSchema>;
export type ZipUploadData = z.infer<typeof zipUploadSchema>;

export type StudentFilterData = z.infer<typeof studentFilterSchema>;
export type SchoolFilterData = z.infer<typeof schoolFilterSchema>;
export type OrderFilterData = z.infer<typeof orderFilterSchema>;
export type TemplateFilterData = z.infer<typeof templateFilterSchema>;
