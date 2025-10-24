-- Adicionar categorias faltantes ao enum memorial_category
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'eletrica';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'seguranca';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'audiovisual_entretenimento';