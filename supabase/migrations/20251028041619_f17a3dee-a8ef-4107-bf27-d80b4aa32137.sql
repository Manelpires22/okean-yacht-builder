-- Deletar aprovações de desconto com formato ANTIGO
-- (que NÃO têm o campo discount_type no request_details)

DELETE FROM approvals
WHERE approval_type = 'discount'
  AND status = 'pending'
  AND request_details->>'discount_type' IS NULL;