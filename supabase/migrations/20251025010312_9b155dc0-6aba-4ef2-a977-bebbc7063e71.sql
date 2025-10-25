-- Apenas atualizar status antigos para novos
UPDATE quotations 
SET status = 'ready_to_send' 
WHERE status = 'approved';

UPDATE quotations 
SET status = 'draft' 
WHERE status NOT IN ('draft', 'pending_commercial_approval', 'pending_technical_approval', 'ready_to_send', 'sent', 'accepted', 'rejected', 'expired');