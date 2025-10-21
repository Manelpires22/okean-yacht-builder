-- 1. Tabela de Usuários (extensão auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('vendedor', 'gerente_comercial', 'engenheiro', 'administrador', 'planejamento', 'suprimentos')),
  department VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Modelos de Iates
CREATE TABLE IF NOT EXISTS public.yacht_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  base_price DECIMAL(15,2) NOT NULL,
  base_delivery_days INTEGER NOT NULL,
  description TEXT,
  technical_specifications JSONB,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Categorias de Opcionais
CREATE TABLE IF NOT EXISTS public.option_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Opcionais
CREATE TABLE IF NOT EXISTS public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES public.option_categories(id),
  base_price DECIMAL(15,2) NOT NULL,
  cost DECIMAL(15,2),
  delivery_days_impact INTEGER DEFAULT 0,
  image_url VARCHAR(500),
  technical_specifications JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Cotações
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(50) NOT NULL UNIQUE,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  yacht_model_id UUID REFERENCES public.yacht_models(id),
  base_price DECIMAL(15,2) NOT NULL,
  total_options_price DECIMAL(15,2) DEFAULT 0,
  total_customizations_price DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(15,2) NOT NULL,
  base_delivery_days INTEGER NOT NULL,
  total_delivery_days INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'converted_to_order')),
  sales_representative_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until DATE NOT NULL
);

-- 6. Tabela de Opcionais por Cotação
CREATE TABLE IF NOT EXISTS public.quotation_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.options(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  delivery_days_impact INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yacht_models (public read, admin write)
CREATE POLICY "Anyone can view active yacht models"
  ON public.yacht_models FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage yacht models"
  ON public.yacht_models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('administrador', 'gerente_comercial')
    )
  );

-- RLS Policies for options (public read, admin write)
CREATE POLICY "Anyone can view active options"
  ON public.options FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage options"
  ON public.options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('administrador', 'gerente_comercial')
    )
  );

-- RLS Policies for option_categories (public read, admin write)
CREATE POLICY "Anyone can view active categories"
  ON public.option_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.option_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'administrador'
    )
  );

-- RLS Policies for quotations (users can see their own, managers see all)
CREATE POLICY "Users can view their own quotations"
  ON public.quotations FOR SELECT
  USING (
    sales_representative_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('gerente_comercial', 'administrador')
    )
  );

CREATE POLICY "Users can create quotations"
  ON public.quotations FOR INSERT
  WITH CHECK (
    sales_representative_id = auth.uid()
  );

CREATE POLICY "Users can update their own draft quotations"
  ON public.quotations FOR UPDATE
  USING (
    sales_representative_id = auth.uid()
    AND status = 'draft'
  );

-- RLS Policies for quotation_options
CREATE POLICY "Users can view quotation options for their quotations"
  ON public.quotation_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations
      WHERE quotations.id = quotation_options.quotation_id
      AND (
        quotations.sales_representative_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('gerente_comercial', 'administrador')
        )
      )
    )
  );

CREATE POLICY "Users can manage options for their draft quotations"
  ON public.quotation_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations
      WHERE quotations.id = quotation_options.quotation_id
      AND quotations.sales_representative_id = auth.uid()
      AND quotations.status = 'draft'
    )
  );

-- Insert sample data
INSERT INTO public.option_categories (name, description, display_order) VALUES
  ('Motorização', 'Opções de motores e sistemas de propulsão', 1),
  ('Interior', 'Acabamentos e equipamentos internos', 2),
  ('Eletrônicos', 'Sistemas de navegação e entretenimento', 3),
  ('Exterior', 'Acabamentos e equipamentos externos', 4),
  ('Conforto', 'Sistemas de ar condicionado e aquecimento', 5);

INSERT INTO public.yacht_models (name, code, base_price, base_delivery_days, description, technical_specifications) VALUES
  ('OKEAN 50', 'OK50', 1500000.00, 180, 'Iate de 50 pés com design moderno e acabamento premium', '{"length": "15.24m", "beam": "4.5m", "draft": "1.2m", "fuel_capacity": "800L", "water_capacity": "400L"}'),
  ('OKEAN 60', 'OK60', 2200000.00, 210, 'Iate de 60 pés ideal para longas travessias', '{"length": "18.29m", "beam": "5.2m", "draft": "1.4m", "fuel_capacity": "1200L", "water_capacity": "600L"}'),
  ('OKEAN 70', 'OK70', 3500000.00, 240, 'Iate de 70 pés com amplos espaços e luxo incomparável', '{"length": "21.34m", "beam": "5.8m", "draft": "1.6m", "fuel_capacity": "1800L", "water_capacity": "800L"}'),
  ('OKEAN 80', 'OK80', 5000000.00, 270, 'Iate de 80 pés flagship da linha OKEAN', '{"length": "24.38m", "beam": "6.4m", "draft": "1.8m", "fuel_capacity": "2500L", "water_capacity": "1000L"}'),
  ('OKEAN 55 Sport', 'OK55S', 1800000.00, 180, 'Versão esportiva do OKEAN 55 com linhas agressivas', '{"length": "16.76m", "beam": "4.8m", "draft": "1.3m", "fuel_capacity": "1000L", "water_capacity": "450L"}'),
  ('OKEAN 65 Flybridge', 'OK65F', 2800000.00, 220, 'OKEAN 65 com flybridge espaçoso', '{"length": "19.81m", "beam": "5.5m", "draft": "1.5m", "fuel_capacity": "1500L", "water_capacity": "700L"}'),
  ('OKEAN 75 Explorer', 'OK75E', 4200000.00, 260, 'Versão explorer para longas expedições', '{"length": "22.86m", "beam": "6.1m", "draft": "1.7m", "fuel_capacity": "2200L", "water_capacity": "900L"}'),
  ('OKEAN 90 Superyacht', 'OK90S', 7500000.00, 300, 'Superyacht com todas as comodidades imagináveis', '{"length": "27.43m", "beam": "7.0m", "draft": "2.0m", "fuel_capacity": "3500L", "water_capacity": "1500L"}');