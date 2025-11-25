-- Remover o trigger antigo que estava causando o conflito
DROP TRIGGER IF EXISTS trigger_create_workflow_steps ON quotation_customizations;

-- Remover a função antiga que não é mais necessária
DROP FUNCTION IF EXISTS create_customization_workflow_steps();