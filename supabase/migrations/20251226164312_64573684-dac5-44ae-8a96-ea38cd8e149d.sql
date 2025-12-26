-- Trigger para atualizar status da matrícula quando um contrato é criado
CREATE OR REPLACE FUNCTION update_hull_number_on_contract()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando contrato é criado, marcar matrícula como 'contracted'
  IF TG_OP = 'INSERT' AND NEW.hull_number_id IS NOT NULL THEN
    UPDATE hull_numbers 
    SET status = 'contracted', contract_id = NEW.id
    WHERE id = NEW.hull_number_id;
  END IF;
  
  -- Quando contrato é deletado, liberar matrícula
  IF TG_OP = 'DELETE' AND OLD.hull_number_id IS NOT NULL THEN
    UPDATE hull_numbers 
    SET status = 'available', contract_id = NULL
    WHERE id = OLD.hull_number_id;
  END IF;
  
  -- Quando hull_number_id é alterado
  IF TG_OP = 'UPDATE' THEN
    -- Liberar matrícula antiga
    IF OLD.hull_number_id IS NOT NULL AND OLD.hull_number_id IS DISTINCT FROM NEW.hull_number_id THEN
      UPDATE hull_numbers 
      SET status = 'available', contract_id = NULL
      WHERE id = OLD.hull_number_id;
    END IF;
    
    -- Reservar nova matrícula
    IF NEW.hull_number_id IS NOT NULL AND OLD.hull_number_id IS DISTINCT FROM NEW.hull_number_id THEN
      UPDATE hull_numbers 
      SET status = 'contracted', contract_id = NEW.id
      WHERE id = NEW.hull_number_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar triggers para INSERT, UPDATE e DELETE
DROP TRIGGER IF EXISTS trigger_update_hull_number_on_contract_insert ON contracts;
CREATE TRIGGER trigger_update_hull_number_on_contract_insert
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_hull_number_on_contract();

DROP TRIGGER IF EXISTS trigger_update_hull_number_on_contract_update ON contracts;
CREATE TRIGGER trigger_update_hull_number_on_contract_update
  AFTER UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_hull_number_on_contract();

DROP TRIGGER IF EXISTS trigger_update_hull_number_on_contract_delete ON contracts;
CREATE TRIGGER trigger_update_hull_number_on_contract_delete
  AFTER DELETE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_hull_number_on_contract();

-- Atualizar matrículas existentes que já estão vinculadas a contratos
UPDATE hull_numbers hn
SET status = 'contracted', contract_id = c.id
FROM contracts c
WHERE c.hull_number_id = hn.id
  AND hn.status = 'available';