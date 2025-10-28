-- Apagar todas as cotações e contratos do sistema

-- 1. Deletar configurações de ATOs
DELETE FROM ato_configurations;

-- 2. Deletar ATOs (Additional To Orders)
DELETE FROM additional_to_orders;

-- 3. Deletar contratos
DELETE FROM contracts;

-- 4. Deletar workflow steps de customizações
DELETE FROM customization_workflow_steps;

-- 5. Deletar aprovações
DELETE FROM approvals;

-- 6. Deletar customizações de cotações
DELETE FROM quotation_customizations;

-- 7. Deletar opções de cotações
DELETE FROM quotation_options;

-- 8. Deletar todas as cotações
DELETE FROM quotations;