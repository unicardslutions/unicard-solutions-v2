-- Enhanced templates schema for advanced template builder
-- This migration adds support for advanced template builder features

-- Add new columns to templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS canvas_type TEXT DEFAULT 'konva';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES templates(id);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create template versions table for version control
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  design_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on template_versions
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for template_versions
CREATE POLICY IF NOT EXISTS "Admins can manage template versions"
  ON template_versions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Template owners can view their versions"
  ON template_versions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM templates WHERE created_by = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON template_versions(template_id, version);

-- Update existing templates to have canvas_type
UPDATE templates SET canvas_type = 'konva' WHERE canvas_type IS NULL;

-- Add comment to document the changes
COMMENT ON COLUMN templates.canvas_type IS 'Canvas type used for template: konva or fabric';
COMMENT ON COLUMN templates.version IS 'Current version number of the template';
COMMENT ON COLUMN templates.parent_template_id IS 'Reference to parent template if this is a clone';
COMMENT ON COLUMN templates.tags IS 'Array of tags for categorizing templates';
COMMENT ON TABLE template_versions IS 'Version history for templates with design data snapshots';
