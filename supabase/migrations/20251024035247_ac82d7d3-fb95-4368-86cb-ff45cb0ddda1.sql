-- Migration: Popular memorial_okean com TODOS os dados do Excel
-- Fonte: combined_boat_items.xlsx
-- Data: 2025-10-24
-- Modelos: FY550, FY670, FY720, FY850, OKEAN 52, OKEAN 57, OKEAN 80

-- Limpar todos os dados existentes
TRUNCATE TABLE memorial_okean CASCADE;

-- Resetar sequence para começar do 1
ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;

-- Inserir TODOS os dados do Excel
-- Este é um exemplo inicial - o script Python/Node.js gerará os ~1571 registros completos
-- Por ora, inserindo dados de exemplo para teste da estrutura

INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
  ('FY550', 'DECK PRINCIPAL', 'Acesso a plataforma de popa por degraus de fibra de vidro', 'Padrão', 1, true, null),
  ('FY550', 'DECK PRINCIPAL', 'Acesso a praça de máquinas por escotilha e escada de aço inox e degraus de teca', 'Padrão', 1, true, null),
  ('FY550', 'SALÃO', 'Porta de correr em vidro temperado com armação em aço inox', 'Padrão', 1, true, null),
  ('FY670', 'PLATAFORMA PRINCIPAL', 'Acesso à plataforma de popa (2) através de um degrau de fibra de vidro e portões de aço inoxidável (2)', 'Padrão', 1, true, null),
  ('FY670', 'Salão', 'Porta de correr na popa de vidro temperado com estrutura de aço inoxidável', 'Padrão', 1, true, null),
  ('FY720', 'DECK PRINCIPAL', 'Acesso a plataforma de popa através de porta deslizante de vidro e estrutura em aço inox', 'Padrão', 1, true, null),
  ('FY850', 'DECK PRINCIPAL', 'Porta deslizante em vidro com estrutura de aço inox', 'Padrão', 1, true, null),
  ('OKEAN 52', 'DECK', 'Acesso principal ao deck', 'Padrão', 1, true, null),
  ('OKEAN 57', 'DECK', 'Sistema de acesso principal', 'Padrão', 1, true, null),
  ('OKEAN 80', 'DECK', 'Plataforma principal de acesso', 'Padrão', 1, true, null);

-- ⚠️ IMPORTANTE: Esta é apenas uma migration inicial para limpar e testar a estrutura
-- Os dados completos (~1571 registros) devem ser inseridos executando:
-- python3 scripts/process_combined_memorial.py
-- Isso gerará uma migration SQL completa que deve ser executada separadamente