-- Limpar ATOs e dependências
DELETE FROM ato_configurations;
DELETE FROM ato_workflow_steps;
DELETE FROM additional_to_orders;

-- Limpar contratos e dependências
DELETE FROM contract_delivery_checklist;
DELETE FROM contracts;

-- Limpar cotações e dependências
DELETE FROM quotation_options;
DELETE FROM quotation_upgrades;
DELETE FROM quotation_customizations;
DELETE FROM customization_workflow_steps;
DELETE FROM quotations;

-- Resetar matrículas vendidas
UPDATE hull_numbers SET status = 'available', contract_id = NULL WHERE status = 'sold';