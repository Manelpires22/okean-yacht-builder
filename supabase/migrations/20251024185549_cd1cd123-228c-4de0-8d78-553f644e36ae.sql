
-- Adicionar novas categorias ao enum memorial_category
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'deck_principal';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'plataforma_popa';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'casco_estrutura';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'area_tecnica';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'navegacao';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'cockpit';
ALTER TYPE memorial_category ADD VALUE IF NOT EXISTS 'caracteristicas_externas';

-- Atualizar função normalize_memorial_category com novos mapeamentos
CREATE OR REPLACE FUNCTION public.normalize_memorial_category(okean_categoria text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  RETURN CASE 
    -- Convés e áreas principais
    WHEN okean_categoria ILIKE '%DECK PRINCIPAL%' 
      OR okean_categoria ILIKE '%DEQUE PRINCIPAL%' THEN 'deck_principal'
    WHEN okean_categoria ILIKE '%CONVÉS PRINCIPAL%' THEN 'conves_principal'
    WHEN okean_categoria ILIKE '%PLATAFORMA PRINCIPAL%' 
      OR okean_categoria ILIKE '%PLATAFORMA DE POPA%'
      OR okean_categoria ILIKE '%PRAÇA%POPA%'
      OR okean_categoria ILIKE '%COCKPIT%' THEN 'plataforma_popa'
    
    -- Interior principal
    WHEN okean_categoria ILIKE '%SALÃO%' THEN 'salao'
    WHEN okean_categoria ILIKE '%ÁREA DE JANTAR%' THEN 'area_jantar'
    WHEN okean_categoria ILIKE '%LAVABO%' THEN 'lavabo'
    
    -- Cozinha
    WHEN okean_categoria ILIKE '%COZINHA%' OR okean_categoria ILIKE '%GALLEY%' THEN 'cozinha_galley'
    WHEN okean_categoria ILIKE '%ÁREA DA COZINHA%' THEN 'area_cozinha'
    
    -- Comando e navegação
    WHEN okean_categoria ILIKE '%COMANDO PRINCIPAL%' 
      OR okean_categoria ILIKE '%COMANDO%' 
      OR okean_categoria ILIKE '%NAVEGAÇÃO%' THEN 'comando_principal'
    WHEN okean_categoria ILIKE '%FLYBRIDGE%' THEN 'flybridge'
    
    -- Lobbies
    WHEN okean_categoria ILIKE '%LOBBY%CONVÉS INFERIOR%' 
      OR okean_categoria ILIKE '%LOBBY%INFERIOR%' THEN 'lobby_conves_inferior'
    WHEN okean_categoria ILIKE '%LOBBY%TRIPULAÇÃO%' THEN 'lobby_tripulacao'
    
    -- Cabines
    WHEN okean_categoria ILIKE '%CABINE MASTER%' 
      OR okean_categoria ILIKE '%CABINE PRINCIPAL%' THEN 'cabine_master'
    WHEN okean_categoria ILIKE '%CABINE VIP PROA%' THEN 'cabine_vip_proa'
    WHEN okean_categoria ILIKE '%CABINE VIP%' 
      OR okean_categoria ILIKE '%CABINES VIP%' THEN 'cabine_vip'
    WHEN okean_categoria ILIKE '%CABINE%HÓSPEDES%BOMBORDO%' 
      OR okean_categoria ILIKE '%CABINE HÓSPEDE%BOMBORDO%' THEN 'cabine_hospedes_bombordo'
    WHEN okean_categoria ILIKE '%CABINE%HÓSPEDES%BORESTE%' 
      OR okean_categoria ILIKE '%CABINE HÓSPEDE%BORESTE%' THEN 'cabine_hospedes_boreste'
    WHEN okean_categoria ILIKE '%CABINE%HÓSPEDE%' THEN 'cabine_hospedes_bombordo'
    WHEN okean_categoria ILIKE '%CABINE%CAPITÃO%' THEN 'cabine_capitao'
    WHEN okean_categoria ILIKE '%CABINE%TRIPULAÇÃO%' 
      OR okean_categoria ILIKE '%CABINE%MARINHEIRO%' THEN 'cabine_tripulacao'
    
    -- Banheiros
    WHEN okean_categoria ILIKE '%BANHEIRO MASTER%' 
      OR okean_categoria ILIKE '%WC%MASTER%'
      OR okean_categoria ILIKE '%WC CABINE MASTER%' THEN 'banheiro_master'
    WHEN okean_categoria ILIKE '%BANHEIRO VIP%' 
      OR okean_categoria ILIKE '%WC VIP%'
      OR okean_categoria ILIKE '%BANHEIROS VIP%' THEN 'banheiro_vip'
    WHEN okean_categoria ILIKE '%BANHEIRO%HÓSPEDES%BOMBORDO%' THEN 'banheiro_hospedes_bombordo'
    WHEN okean_categoria ILIKE '%BANHEIRO%HÓSPEDES%BORESTE%' THEN 'banheiro_hospedes_boreste'
    WHEN okean_categoria ILIKE '%BANHEIRO%HÓSPEDES%COMPARTILHADO%' 
      OR okean_categoria ILIKE '%BANHEIROS%HÓSPEDES%'
      OR okean_categoria ILIKE '%WC%HÓSPEDE%' THEN 'banheiro_hospedes_compartilhado'
    WHEN okean_categoria ILIKE '%BANHEIRO%CAPITÃO%' THEN 'banheiro_capitao'
    WHEN okean_categoria ILIKE '%BANHEIRO%TRIPULAÇÃO%' THEN 'banheiro_tripulacao'
    
    -- Áreas técnicas
    WHEN okean_categoria ILIKE '%SALA DE MÁQUINAS%' 
      OR okean_categoria ILIKE '%CASA%MÁQUINA%'
      OR okean_categoria ILIKE '%ÁREA TÉCNICA%' THEN 'sala_maquinas'
    WHEN okean_categoria ILIKE '%GARAGEM%' THEN 'garagem'
    
    -- Sistemas
    WHEN okean_categoria ILIKE '%PROPULSÃO%' 
      OR okean_categoria ILIKE '%PROPULSOR%' THEN 'propulsao_controle'
    WHEN okean_categoria ILIKE '%ESTABILIZAÇÃO%' THEN 'sistema_estabilizacao'
    WHEN okean_categoria ILIKE '%EQUIPAMENTOS ELETRÔNICOS%' THEN 'equipamentos_eletronicos'
    WHEN okean_categoria ILIKE '%EXTINÇÃO%' OR okean_categoria ILIKE '%INCÊNDIO%' THEN 'sistema_extincao_incendio'
    WHEN okean_categoria ILIKE '%AR-CONDICIONADO%' OR okean_categoria ILIKE '%AR CONDICIONADO%' THEN 'sistema_ar_condicionado'
    WHEN okean_categoria ILIKE '%BOMBAS%PORÃO%' THEN 'sistema_bombas_porao'
    WHEN okean_categoria ILIKE '%ÁGUA%' OR okean_categoria ILIKE '%SANITÁRIO%' THEN 'sistema_agua_sanitario'
    WHEN okean_categoria ILIKE '%ELÉTRICA%' OR okean_categoria ILIKE '%ELÉTRICO%' THEN 'eletrica'
    WHEN okean_categoria ILIKE '%SEGURANÇA%' OR okean_categoria ILIKE '%SALVATAGEM%' THEN 'seguranca'
    WHEN okean_categoria ILIKE '%AUDIOVISUAL%' OR okean_categoria ILIKE '%ENTRETENIMENTO%' THEN 'audiovisual_entretenimento'
    
    -- Estruturais e externos
    WHEN okean_categoria ILIKE '%CASCO%CONVÉS%' 
      OR okean_categoria ILIKE '%CASCO%DECK%'
      OR okean_categoria ILIKE '%ESTRUTURA%' THEN 'casco_estrutura'
    WHEN okean_categoria ILIKE '%CARACTERÍSTICAS EXTERNAS%' 
      OR okean_categoria ILIKE '%EXTERIOR%' THEN 'caracteristicas_externas'
    
    -- Outros e diversos
    WHEN okean_categoria ILIKE '%OPCIONAIS%' 
      OR okean_categoria ILIKE '%DIVERSOS%'
      OR okean_categoria ILIKE '%CORREDOR%' THEN 'outros'
    
    ELSE 'outros'
  END;
END;
$function$;
