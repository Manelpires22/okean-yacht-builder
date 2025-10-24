-- Adicionar categoria banheiro_hospedes_compartilhado ao enum memorial_category
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_hospedes_compartilhado';