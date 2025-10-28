-- Deletar TODAS as aprovações de desconto da cotação V2 (incluindo duplicatas)
-- Isso garante que apenas aprovações com estrutura nova (discount_type separado) existirão

DELETE FROM approvals 
WHERE quotation_id = '8e001829-3b0f-4129-8612-0ee092026133'
  AND approval_type = 'discount';