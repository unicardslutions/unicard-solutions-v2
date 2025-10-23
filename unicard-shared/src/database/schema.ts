import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Students table
    tableSchema({
      name: 'students',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'roll_number', type: 'string' },
        { name: 'class', type: 'string' },
        { name: 'section', type: 'string' },
        { name: 'photo_url', type: 'string', isOptional: true },
        { name: 'school_id', type: 'string' },
        { name: 'school_name', type: 'string' },
        { name: 'school_logo', type: 'string', isOptional: true },
        { name: 'parent_name', type: 'string', isOptional: true },
        { name: 'parent_phone', type: 'string', isOptional: true },
        { name: 'parent_email', type: 'string', isOptional: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'date_of_birth', type: 'string', isOptional: true },
        { name: 'blood_group', type: 'string', isOptional: true },
        { name: 'emergency_contact', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' }, // 'pending', 'synced', 'error'
        { name: 'sync_error', type: 'string', isOptional: true },
      ],
    }),

    // Orders table
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'school_id', type: 'string' },
        { name: 'template_id', type: 'string' },
        { name: 'template_name', type: 'string' },
        { name: 'template_data', type: 'string' }, // JSON string
        { name: 'status', type: 'string' }, // 'draft', 'submitted', 'processing', 'completed', 'cancelled'
        { name: 'total_students', type: 'number' },
        { name: 'completed_students', type: 'number' },
        { name: 'price_per_card', type: 'number' },
        { name: 'total_amount', type: 'number' },
        { name: 'delivery_address', type: 'string' },
        { name: 'delivery_phone', type: 'string' },
        { name: 'delivery_email', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'submitted_at', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'sync_error', type: 'string', isOptional: true },
      ],
    }),

    // Templates table (cached)
    tableSchema({
      name: 'templates',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'thumbnail_url', type: 'string', isOptional: true },
        { name: 'template_data', type: 'string' }, // JSON string
        { name: 'canvas_type', type: 'string' }, // 'konva' or 'fabric'
        { name: 'version', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'is_premium', type: 'boolean' },
        { name: 'price', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'cached_at', type: 'number' },
        { name: 'last_used', type: 'number', isOptional: true },
      ],
    }),

    // Sync queue table
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'table_name', type: 'string' },
        { name: 'record_id', type: 'string' },
        { name: 'operation', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'data', type: 'string' }, // JSON string
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'last_retry_at', type: 'number', isOptional: true },
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'priority', type: 'number' }, // Higher number = higher priority
      ],
    }),

    // Schools table (cached for admin app)
    tableSchema({
      name: 'schools',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'area', type: 'string', isOptional: true },
        { name: 'pin_code', type: 'string', isOptional: true },
        { name: 'logo_url', type: 'string', isOptional: true },
        { name: 'principal_name', type: 'string', isOptional: true },
        { name: 'principal_phone', type: 'string', isOptional: true },
        { name: 'principal_email', type: 'string', isOptional: true },
        { name: 'is_verified', type: 'boolean' },
        { name: 'verification_status', type: 'string' }, // 'pending', 'verified', 'rejected'
        { name: 'verification_notes', type: 'string', isOptional: true },
        { name: 'total_students', type: 'number' },
        { name: 'total_orders', type: 'number' },
        { name: 'last_order_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'cached_at', type: 'number' },
      ],
    }),

    // Advertisements table (cached)
    tableSchema({
      name: 'advertisements',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'link_url', type: 'string', isOptional: true },
        { name: 'target_audience', type: 'string' }, // 'all', 'schools', 'admins'
        { name: 'is_active', type: 'boolean' },
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'click_count', type: 'number' },
        { name: 'view_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'cached_at', type: 'number' },
      ],
    }),

    // User settings table
    tableSchema({
      name: 'user_settings',
      columns: [
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Offline files table
    tableSchema({
      name: 'offline_files',
      columns: [
        { name: 'file_name', type: 'string' },
        { name: 'file_path', type: 'string' },
        { name: 'file_type', type: 'string' }, // 'image', 'document', 'template'
        { name: 'file_size', type: 'number' },
        { name: 'related_record_id', type: 'string', isOptional: true },
        { name: 'related_table', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'last_accessed', type: 'number' },
      ],
    }),
  ],
});
