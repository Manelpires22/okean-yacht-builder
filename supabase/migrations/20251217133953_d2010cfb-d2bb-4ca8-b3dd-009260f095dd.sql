-- Adicionar novos valores ao enum memorial_category
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cockpit_praca_popa';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cozinha_gourmet';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'proa';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'diversos';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_social';