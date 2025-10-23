-- Enhanced templates schema for advanced template builder
ALTER TABLE templates ADD COLUMN canvas_type TEXT DEFAULT 'konva';
ALTER TABLE templates ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE templates ADD COLUMN parent_template_id UUID REFERENCES templates(id);
ALTER TABLE templates ADD COLUMN tags TEXT[];

-- Create template versions table for version control
CREATE TABLE template_versions (
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
CREATE POLICY "Admins can manage template versions"
  ON template_versions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Template owners can view their versions"
  ON template_versions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM templates WHERE created_by = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX idx_template_versions_version ON template_versions(template_id, version);

-- Update existing templates to have canvas_type
UPDATE templates SET canvas_type = 'konva' WHERE canvas_type IS NULL;
