-- Adicionar status "approved" ao check constraint das cotações
-- Este status representa aprovação interna antes de enviar ao cliente

-- Remover constraint antiga
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;

-- Adicionar constraint com novo status "approved"
ALTER TABLE quotations ADD CONSTRAINT quotations_status_check 
CHECK (status IN (
  'draft',
  'pending_commercial_approval',
  'pending_technical_approval', 
  'ready_to_send',
  'sent',
  'approved',
  'accepted',
  'rejected',
  'expired',
  'converted_to_contract'
));