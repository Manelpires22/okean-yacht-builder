
-- CORREÇÃO DEFINITIVA: Deletar approval técnico fantasma
-- Este approval não deveria existir pois workflows técnicos usam quotation_customizations.workflow_status

DELETE FROM approvals 
WHERE id = 'b1ccd20d-722d-4bc6-bb35-427511aea8a1'
AND approval_type = 'technical';
