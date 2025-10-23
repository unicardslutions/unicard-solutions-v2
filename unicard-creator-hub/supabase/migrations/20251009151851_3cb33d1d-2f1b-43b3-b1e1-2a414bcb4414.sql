-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'school');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('draft', 'submitted', 'in_design', 'printed', 'delivered', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  school_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT,
  pin_code TEXT,
  whatsapp_number TEXT NOT NULL,
  logo_url TEXT,
  contact_photo_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  design_data JSONB NOT NULL,
  orientation TEXT NOT NULL CHECK (orientation IN ('portrait', 'landscape')),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id),
  status order_status NOT NULL DEFAULT 'draft',
  total_students INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  father_name TEXT,
  date_of_birth DATE,
  roll_number TEXT,
  student_id TEXT,
  class TEXT NOT NULL,
  section TEXT,
  address TEXT,
  gender TEXT,
  phone_number TEXT,
  blood_group TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Schools RLS policies
CREATE POLICY "Schools can view their own data"
  ON public.schools FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all schools"
  ON public.schools FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can insert their own data"
  ON public.schools FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Schools can update their own data"
  ON public.schools FOR UPDATE
  USING (auth.uid() = user_id);

-- Templates RLS policies
CREATE POLICY "Everyone can view public templates"
  ON public.templates FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Admins can view all templates"
  ON public.templates FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert templates"
  ON public.templates FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
  ON public.templates FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Orders RLS policies
CREATE POLICY "Schools can view their own orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = orders.school_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can insert their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = school_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can update their own orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = orders.school_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Students RLS policies
CREATE POLICY "Schools can view their own students"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.schools ON orders.school_id = schools.id
      WHERE orders.id = students.order_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all students"
  ON public.students FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can insert their own students"
  ON public.students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.schools ON orders.school_id = schools.id
      WHERE orders.id = order_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can update their own students"
  ON public.students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.schools ON orders.school_id = schools.id
      WHERE orders.id = students.order_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all students"
  ON public.students FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can delete their own students"
  ON public.students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.schools ON orders.school_id = schools.id
      WHERE orders.id = students.order_id
      AND schools.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('school-logos', 'school-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);

-- Storage policies for student photos
CREATE POLICY "Schools can upload their students photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Schools can view their students photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can view all student photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-photos'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Storage policies for school logos
CREATE POLICY "Anyone can view school logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-logos');

CREATE POLICY "Schools can upload their logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-logos'
    AND auth.role() = 'authenticated'
  );

-- Storage policies for templates
CREATE POLICY "Anyone can view templates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'templates');

CREATE POLICY "Admins can upload templates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'templates'
    AND public.has_role(auth.uid(), 'admin')
  );