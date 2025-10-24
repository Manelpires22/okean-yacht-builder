-- Expandir enum memorial_category com todas as 32 categorias do memorial FY850
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'conves_principal';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'salao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'area_jantar';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'lavabo';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'area_cozinha';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cozinha_galley';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'comando_principal';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'flybridge';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'lobby_conves_inferior';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cabine_master';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_master';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cabine_vip';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_vip';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cabine_hospedes_bombordo';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_hospedes_bombordo';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cabine_hospedes_boreste';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_hospedes_boreste';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_capitao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cabine_capitao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'banheiro_tripulacao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cabine_tripulacao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'lobby_tripulacao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'sala_maquinas';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'garagem';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'propulsao_controle';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'sistema_estabilizacao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'equipamentos_eletronicos';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'sistema_extincao_incendio';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'sistema_ar_condicionado';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'sistema_bombas_porao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'sistema_agua_sanitario';

-- Remover a edge function antiga de opcionais que não será mais necessária
-- Os opcionais agora fazem parte do memorial base distribuídos nas categorias corretas