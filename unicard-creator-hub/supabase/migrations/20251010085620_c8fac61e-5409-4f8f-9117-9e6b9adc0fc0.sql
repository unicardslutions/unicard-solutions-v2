-- Drop existing policies cleanly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Schools can view their own data" ON public.schools;
DROP POLICY IF EXISTS "Admins can view all schools" ON public.schools;
DROP POLICY IF EXISTS "Schools can insert their own data" ON public.schools;
DROP POLICY IF EXISTS "Schools can update their own data" ON public.schools;
DROP POLICY IF EXISTS "Everyone can view public templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.templates;
DROP POLICY IF EXISTS "Schools can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Schools can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Schools can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Schools can view their own students" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Schools can insert their own students" ON public.students;
DROP POLICY IF EXISTS "Schools can update their own students" ON public.students;
DROP POLICY IF EXISTS "Admins can update all students" ON public.students;
DROP POLICY IF EXISTS "Schools can delete their own students" ON public.students;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can view their own data" ON public.schools FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all schools" ON public.schools FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Schools can insert their own data" ON public.schools FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Schools can update their own data" ON public.schools FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view public templates" ON public.templates FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Admins can view all templates" ON public.templates FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert templates" ON public.templates FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update templates" ON public.templates FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can view their own orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.schools s WHERE s.id = orders.school_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Schools can insert their own orders" ON public.orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.user_id = auth.uid())
);
CREATE POLICY "Schools can update their own orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.schools s WHERE s.id = orders.school_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Schools can view their own students" ON public.students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o JOIN public.schools s ON o.school_id = s.id
    WHERE o.id = students.order_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all students" ON public.students FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Schools can insert their own students" ON public.students FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o JOIN public.schools s ON o.school_id = s.id
    WHERE o.id = order_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Schools can update their own students" ON public.students FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders o JOIN public.schools s ON o.school_id = s.id
    WHERE o.id = students.order_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can update all students" ON public.students FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Schools can delete their own students" ON public.students FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.orders o JOIN public.schools s ON o.school_id = s.id
    WHERE o.id = students.order_id AND s.user_id = auth.uid()
  )
);

-- Drop and recreate storage policies
DROP POLICY IF EXISTS "Schools can upload their students photos" ON storage.objects;
DROP POLICY IF EXISTS "Schools can view their students photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view school logos" ON storage.objects;
DROP POLICY IF EXISTS "Schools can upload their logo" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload templates" ON storage.objects;

CREATE POLICY "Schools can upload their students photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'student-photos' AND (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.user_id = auth.uid() AND (storage.foldername(name))[1] = s.id::text
    )
  )
);

CREATE POLICY "Schools can view their students photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'student-photos' AND (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.user_id = auth.uid() AND (storage.foldername(name))[1] = s.id::text
    )
  )
);

CREATE POLICY "Anyone can view school logos" ON storage.objects FOR SELECT USING (bucket_id = 'school-logos');

CREATE POLICY "Schools can upload their logo" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'school-logos' AND EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.user_id = auth.uid() AND (storage.foldername(name))[1] = s.id::text
  )
);

CREATE POLICY "Anyone can view templates" ON storage.objects FOR SELECT USING (bucket_id = 'templates');

CREATE POLICY "Admins can upload templates" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin')
);