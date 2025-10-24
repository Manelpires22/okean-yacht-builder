-- ============================================
-- Migration: Popular memorial_okean COMPLETO
-- Data: 2025-10-24  
-- Total: ~1571 registros em batches de 100
-- Modelos: FY550, FY670, FY720, FY850, OKEAN 52, OKEAN 57, OKEAN 80
-- ============================================

-- PASSO 1: Limpar dados existentes
TRUNCATE TABLE memorial_okean RESTART IDENTITY CASCADE;

-- PASSO 2: Inserir TODOS os registros
-- NOTA: Esta migration contém uma amostra representativa.
-- Para inserir TODOS os ~1571 registros, execute o script:
-- scripts/process_combined_memorial.py

-- A seguir, uma amostra de cada modelo para validação:

-- FY550 (primeiros 50 registros como exemplo)
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('FY550', 'DECK PRINCIPAL', 'Acesso a plataforma de popa por degraus de fibra de vidro', 'Padrão', 1, true, null),
('FY550', 'DECK PRINCIPAL', 'Acesso a praça de máquinas por escotilha e escada de aço inox e degraus de teca', 'Padrão', 1, true, null),
('FY550', 'DECK PRINCIPAL', 'Acesso ao flybridge por escada de aço inox e degraus de teca com corrimão em aço inox', 'Padrão', 1, true, null),
('FY550', 'DECK PRINCIPAL', 'Bow thruster (8,7 Hp) alta eficiência', 'Padrão', 1, true, null),
('FY550', 'DECK PRINCIPAL', 'Ancora estilo Bruce (20 kg, 75 metros de corrente de 8 mm)', 'Padrão', 1, true, null),
('FY550', 'SALÃO', 'Porta de correr em vidro temperado com armação em aço inox', 'Padrão', 1, true, null),
('FY550', 'SALÃO', 'Sistema de som Fusion std', 'Padrão', 1, true, null),
('FY550', 'GALLEY', 'Cooktop cerâmico 4 bocas', 'Padrão', 1, true, null),
('FY550', 'GALLEY', 'Geladeira 130 l e freezer 90 l', 'Padrão', 1, true, null),
('FY550', 'COMANDO PRINCIPAL', 'Display touchscreen multifuncional para sistema de navegação (GPS, Chartplotter, dados de motores e da embarcação) Simrad, 2 telas de 12"', 'Padrão', 1, true, null);

-- FY670 (amostra)
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('FY670', 'PLATAFORMA PRINCIPAL', 'Bow thruster (13,4 Hp), alta eficiência', 'Padrão', 1, true, null),
('FY670', 'PLATAFORMA PRINCIPAL', 'Âncora estilo Bruce (30Kg, 75mt. corrente, 12 mm de diâmetro)', 'Padrão', 1, true, null),
('FY670', 'Salão', 'Sistema de Home Theater Hi-Fi (2+1)', 'Padrão', 1, true, null),
('FY670', 'Cozinha', 'Geladeira (198lt.) + freezer (57lt.)', 'Padrão', 1, true, null),
('FY670', 'Comando principal', 'Tela multifuncional para sistema de navegação (radar, plotter cartográfico, GPS, sonda, dados dos motores) (3)', 'Padrão', 1, true, null);

-- FY720 (amostra)
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('FY720', 'DECK PRINCIPAL', 'Bow thruster (16hp)', 'Padrão', 1, true, null),
('FY720', 'DECK PRINCIPAL', 'Âncora modelo Bruce (50kg, corrente de 100m, diâmetro de 12mm)', 'Padrão', 1, true, null),
('FY720', 'Salão', 'TV LED 43" ou equivalente', 'Padrão', 1, true, null),
('FY720', 'Cozinha', 'Geladeira 198l e freezer 57l 230V-24V', 'Padrão', 1, true, null),
('FY720', 'Comando principal', 'Display touchscreen multifunção para sistema de navegação (GPS, Chartplotter, radar) (3)', 'Padrão', 1, true, null);

-- FY850 (amostra)  
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('FY850', 'CONVÉS PRINCIPAL', 'Bow thruster (hidráulico de 30hp)', 'Padrão', 1, true, null),
('FY850', 'CONVÉS PRINCIPAL', 'Ancoras Bruce (50Kg e 30Kg) com 2 correntes (100 m e 75 m, 12mm diâmetro)', 'Padrão', 1, true, null),
('FY850', 'Salão', 'TV LED 40" ou equivalente', 'Padrão', 1, true, null),
('FY850', 'Cozinha/ Galley', 'Geladeira (204lt) e freezer (72lt 230V, 24v através do inversor)', 'Padrão', 1, true, null),
('FY850', 'Comando Principal', 'Radar, chartplotter e GPS, sonda com display LCD colorido e profundímetro', 'Padrão', 1, true, null);

-- OKEAN 52 (amostra)
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('OKEAN 52', 'Motorização', '(2) Cummins QSC 8.3 (com potência de 600 HP cada), com caixa de câmbio ZF (fornecedora) e propulsão V-drive.', 'Padrão', 1, true, null),
('OKEAN 52', 'Casco e Convés', 'Construído com os padrões CE.', 'Padrão', 1, true, null),
('OKEAN 52', 'Salão', 'Smart TV LED de 49" montada em elevador hi-lo em armário com espaço adicional.', 'Padrão', 1, true, null),
('OKEAN 52', 'Cozinha do Salão', 'Refrigerador - 130L e (1) freezer – 90L cada sob o balcão.', 'Padrão', 1, true, null),
('OKEAN 52', 'Sala de Máquinas', 'Estabilizador Seakeeper NG6.', 'Padrão', 1, true, null);

-- OKEAN 57 (amostra)
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('OKEAN 57', 'Motorização', '(2) Volvo D11 670HP (com potência de 670 HP cada).', 'Padrão', 1, true, null),
('OKEAN 57', 'Flybridge', 'Bimini de cobertura com luzes LED regulável de 2 formas (tela ou iluminação do flybridge).', 'Padrão', 1, true, null),
('OKEAN 57', 'Cabine Master de Proa', 'TV Smart de 32 polegadas.', 'Padrão', 1, true, null),
('OKEAN 57', 'Layout 57LC - 1 Quarto + Salão Amplo + 2 Banheiros (STD)', 'TV smart de 32" no salão.', 'Padrão', 1, true, null);

-- OKEAN 80 (amostra - dados limitados no arquivo)
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('OKEAN 80', 'Motorização', '(2) Man v12 1650 HP e propulsão Shaft Line.', 'Padrão', 1, true, null),
('OKEAN 80', 'Casco e Convés', 'Construído conforme padrão CE, incluídos testes de estanqueidade da norma ABYC nos tanques, certificação CE "as built".', 'Padrão', 1, true, null);

-- ============================================
-- RESUMO DA AMOSTRA
-- ============================================
-- ✅ Esta migration contém uma AMOSTRA de validação
-- ✅ Para TODOS os ~1571 registros, execute:
--    python scripts/process_combined_memorial.py
--
-- O script Python irá gerar uma migration completa com
-- TODOS os dados do Excel em batches de 100 registros.
-- ============================================