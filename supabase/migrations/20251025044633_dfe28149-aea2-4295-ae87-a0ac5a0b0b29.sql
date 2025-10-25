-- Add pm_engenharia role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pm_engenharia';

-- Also add other roles that are being used in the frontend
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'producao';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'comprador';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'planejador';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'broker';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'diretor_comercial';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'backoffice_comercial';