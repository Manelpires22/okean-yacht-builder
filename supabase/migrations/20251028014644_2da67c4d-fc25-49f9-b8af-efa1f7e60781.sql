-- Adicionar sufixo de versão ao número da cotação para todas as cotações existentes
-- Formato: QT-2025-858 → QT-2025-858-V1 (se version=1)

UPDATE quotations
SET quotation_number = quotation_number || '-V' || COALESCE(version, 1)
WHERE quotation_number NOT LIKE '%-V%';