-- Permitir memorial_item_id NULL para importação de upgrades sem vínculo
ALTER TABLE memorial_upgrades ALTER COLUMN memorial_item_id DROP NOT NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN memorial_upgrades.memorial_item_id IS 'ID do item do memorial vinculado. Pode ser NULL para upgrades pendentes de vinculação (não aparecem no configurador).';