-- Deletar aprovações antigas com approval_type 'commercial'
-- (formato antigo antes da mudança para 'discount')

DELETE FROM approvals
WHERE approval_type = 'commercial'
  AND status = 'pending'
  AND quotation_id = 'e5670977-11ae-419c-9fe5-586814e03630';