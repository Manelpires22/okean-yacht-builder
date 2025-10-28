-- Deletar aprovações antigas da cotação V2 (formato antigo de request_details)
-- Isso permitirá criar novas aprovações com estrutura correta (discount_type separado)

DELETE FROM approvals 
WHERE quotation_id = '8e001829-3b0f-4129-8612-0ee092026133'
  AND approval_type = 'discount'
  AND status = 'pending';