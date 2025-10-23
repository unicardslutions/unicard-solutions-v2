-- Create advertisements table for admin-uploaded ads
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertisements
CREATE POLICY "Anyone can view active advertisements"
  ON public.advertisements FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all advertisements"
  ON public.advertisements FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert advertisements"
  ON public.advertisements FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update advertisements"
  ON public.advertisements FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete advertisements"
  ON public.advertisements FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for advertisements
INSERT INTO storage.buckets (id, name, public) 
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for advertisements
CREATE POLICY "Anyone can view advertisements"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'advertisements');

CREATE POLICY "Admins can upload advertisements"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'advertisements'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete advertisements"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'advertisements'
    AND public.has_role(auth.uid(), 'admin')
  );

