-- Trigger para criar aprovação técnica automática quando customização de contrato é solicitada
CREATE OR REPLACE FUNCTION create_approval_for_contract_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_id uuid;
BEGIN
  -- Apenas para customizações de contrato (não incluídas inicialmente)
  IF NEW.included_in_contract = false AND NEW.status = 'pending' THEN
    
    -- Buscar o vendedor responsável pela cotação
    SELECT sales_representative_id INTO requester_id
    FROM quotations
    WHERE id = NEW.quotation_id
    LIMIT 1;
    
    -- Criar aprovação técnica automática
    INSERT INTO approvals (
      quotation_id,
      approval_type,
      requested_by,
      requested_at,
      status,
      request_details,
      notes
    ) VALUES (
      NEW.quotation_id,
      'technical',
      COALESCE(requester_id, auth.uid()), -- Usar vendedor da cotação ou usuário logado
      now(),
      'pending',
      jsonb_build_object(
        'is_contract_revision', true,
        'customization_id', NEW.id,
        'customization_code', NEW.customization_code,
        'item_name', NEW.item_name
      ),
      'Aprovação técnica de revisão de contrato'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_create_approval_for_contract_revision ON quotation_customizations;

CREATE TRIGGER trigger_create_approval_for_contract_revision
  AFTER INSERT ON quotation_customizations
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_for_contract_revision();

-- Comentário para documentação
COMMENT ON FUNCTION create_approval_for_contract_revision() IS 
'Cria automaticamente uma aprovação técnica quando uma revisão de contrato (customização com included_in_contract=false) é solicitada';