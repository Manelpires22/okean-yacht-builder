-- Criar tabela memorial_categories
CREATE TABLE IF NOT EXISTS public.memorial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir categorias baseadas no enum memorial_category
INSERT INTO public.memorial_categories (value, label, display_order, description) VALUES
  ('deck_principal', 'Deck Principal', 1, 'Área principal do convés'),
  ('conves_principal', 'Convés Principal', 2, 'Convés principal da embarcação'),
  ('plataforma_popa', 'Plataforma de Popa', 3, 'Plataforma traseira'),
  ('salao', 'Salão', 4, 'Salão principal'),
  ('area_jantar', 'Área de Jantar', 5, 'Área de refeições'),
  ('lavabo', 'Lavabo', 6, 'Lavabo'),
  ('cozinha_galley', 'Cozinha/Galley', 7, 'Área da cozinha'),
  ('area_cozinha', 'Área da Cozinha', 8, 'Área de preparo'),
  ('comando_principal', 'Comando Principal', 9, 'Área de comando e navegação'),
  ('flybridge', 'Flybridge', 10, 'Deck superior'),
  ('lobby_conves_inferior', 'Lobby Convés Inferior', 11, 'Hall de entrada inferior'),
  ('lobby_tripulacao', 'Lobby Tripulação', 12, 'Área da tripulação'),
  ('cabine_master', 'Cabine Master', 13, 'Cabine principal'),
  ('cabine_vip_proa', 'Cabine VIP Proa', 14, 'Cabine VIP frontal'),
  ('cabine_vip', 'Cabine VIP', 15, 'Cabines VIP'),
  ('cabine_hospedes_bombordo', 'Cabine Hóspedes Bombordo', 16, 'Cabine lado esquerdo'),
  ('cabine_hospedes_boreste', 'Cabine Hóspedes Boreste', 17, 'Cabine lado direito'),
  ('cabine_capitao', 'Cabine Capitão', 18, 'Cabine do capitão'),
  ('cabine_tripulacao', 'Cabine Tripulação', 19, 'Cabines da tripulação'),
  ('banheiro_master', 'Banheiro Master', 20, 'Banheiro da cabine master'),
  ('banheiro_vip', 'Banheiro VIP', 21, 'Banheiros VIP'),
  ('banheiro_hospedes_bombordo', 'Banheiro Hóspedes Bombordo', 22, 'Banheiro lado esquerdo'),
  ('banheiro_hospedes_boreste', 'Banheiro Hóspedes Boreste', 23, 'Banheiro lado direito'),
  ('banheiro_hospedes_compartilhado', 'Banheiro Hóspedes Compartilhado', 24, 'Banheiro compartilhado'),
  ('banheiro_capitao', 'Banheiro Capitão', 25, 'Banheiro do capitão'),
  ('banheiro_tripulacao', 'Banheiro Tripulação', 26, 'Banheiro da tripulação'),
  ('sala_maquinas', 'Sala de Máquinas', 27, 'Casa de máquinas'),
  ('garagem', 'Garagem', 28, 'Área de garagem'),
  ('propulsao_controle', 'Propulsão e Controle', 29, 'Sistema de propulsão'),
  ('sistema_estabilizacao', 'Sistema de Estabilização', 30, 'Estabilizadores'),
  ('equipamentos_eletronicos', 'Equipamentos Eletrônicos', 31, 'Eletrônica de bordo'),
  ('sistema_extincao_incendio', 'Sistema de Extinção de Incêndio', 32, 'Segurança contra incêndio'),
  ('sistema_ar_condicionado', 'Sistema de Ar-Condicionado', 33, 'Climatização'),
  ('sistema_bombas_porao', 'Sistema de Bombas de Porão', 34, 'Bombas de esgotamento'),
  ('sistema_agua_sanitario', 'Sistema de Água e Sanitário', 35, 'Sistemas hidráulicos'),
  ('eletrica', 'Elétrica', 36, 'Sistema elétrico'),
  ('seguranca', 'Segurança', 37, 'Equipamentos de segurança'),
  ('audiovisual_entretenimento', 'Audiovisual e Entretenimento', 38, 'Sistema de som e vídeo'),
  ('casco_estrutura', 'Casco e Estrutura', 39, 'Estrutura do casco'),
  ('caracteristicas_externas', 'Características Externas', 40, 'Acabamento externo'),
  ('outros', 'Outros', 999, 'Itens diversos')
ON CONFLICT (value) DO NOTHING;

-- Adicionar coluna category_id em memorial_items (nullable inicialmente)
ALTER TABLE public.memorial_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.memorial_categories(id);

-- Migrar dados existentes: mapear enum category para category_id
UPDATE public.memorial_items mi
SET category_id = mc.id
FROM public.memorial_categories mc
WHERE mi.category::text = mc.value;

-- Tornar category_id NOT NULL após migração
ALTER TABLE public.memorial_items 
ALTER COLUMN category_id SET NOT NULL;

-- Criar index para performance
CREATE INDEX IF NOT EXISTS idx_memorial_items_category_id 
ON public.memorial_items(category_id);

-- Adicionar trigger para updated_at em memorial_categories
CREATE TRIGGER update_memorial_categories_updated_at
BEFORE UPDATE ON public.memorial_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para memorial_categories
ALTER TABLE public.memorial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
ON public.memorial_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins and managers can manage categories"
ON public.memorial_categories FOR ALL
USING (
  has_role(auth.uid(), 'administrador') OR 
  has_role(auth.uid(), 'gerente_comercial')
)
WITH CHECK (
  has_role(auth.uid(), 'administrador') OR 
  has_role(auth.uid(), 'gerente_comercial')
);