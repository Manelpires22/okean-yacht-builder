-- Criar categoria padrão para opcionais importados de documentos
INSERT INTO option_categories (id, name, description, display_order, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Importados (Sem Categoria)',
  'Opcionais extraídos automaticamente de documentos aguardando categorização manual',
  999,
  true
)
ON CONFLICT (id) DO NOTHING;