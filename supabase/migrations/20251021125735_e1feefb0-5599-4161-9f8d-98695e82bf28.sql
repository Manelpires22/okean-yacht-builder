-- 1. Drop existing policies that depend on users.role column
DROP POLICY IF EXISTS "Admins can manage yacht models" ON public.yacht_models;
DROP POLICY IF EXISTS "Admins can manage options" ON public.options;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.option_categories;
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can view quotation options for their quotations" ON public.quotation_options;

-- 2. Create enum for user roles
CREATE TYPE public.app_role AS ENUM (
  'administrador',
  'gerente_comercial', 
  'comercial',
  'producao',
  'financeiro'
);

-- 3. Create user_roles table (many-to-many)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 5. Create security definer function to check roles (avoids RLS recursion)
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
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 8. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies for users table
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Only admins can update users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Only admins can delete users"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

-- 10. Recreate policies for other tables using has_role() function
CREATE POLICY "Admins can manage yacht models"
  ON public.yacht_models FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'gerente_comercial')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'gerente_comercial')
  );

CREATE POLICY "Admins can manage options"
  ON public.options FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'gerente_comercial')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'gerente_comercial')
  );

CREATE POLICY "Admins can manage categories"
  ON public.option_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can view their own quotations"
  ON public.quotations FOR SELECT
  TO authenticated
  USING (
    (sales_representative_id = auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente_comercial') OR 
    public.has_role(auth.uid(), 'administrador')
  );

CREATE POLICY "Users can view quotation options for their quotations"
  ON public.quotation_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM quotations
      WHERE quotations.id = quotation_options.quotation_id 
        AND (
          quotations.sales_representative_id = auth.uid() OR 
          public.has_role(auth.uid(), 'gerente_comercial') OR 
          public.has_role(auth.uid(), 'administrador')
        )
    )
  );

-- 11. Remove old role column from users table
ALTER TABLE public.users DROP COLUMN role;