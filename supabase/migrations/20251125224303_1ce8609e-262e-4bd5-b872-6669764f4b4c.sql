-- Tornar item_id nullable em ato_configurations para permitir customizações sem referência
ALTER TABLE ato_configurations 
ALTER COLUMN item_id DROP NOT NULL;