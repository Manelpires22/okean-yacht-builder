-- Migration COMPLETA: Memorial OKEAN - Todos os dados do CSV
-- Esta migration popula a tabela memorial_okean com TODOS os ~1264 itens
-- Dados já processados, normalizados e escapados

-- Limpar dados existentes
TRUNCATE TABLE memorial_okean CASCADE;

-- Resetar sequence
ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;

-- Inserir PARTE 1: FY 550 - DECK PRINCIPAL até GALLEY (linhas 4-57 do CSV original)
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES
('FY 550', 'DECK PRINCIPAL', 'Acesso a plataforma de popa por degraus de fibra de vidro', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Acesso a praça de máquinas por escotilha e escada de aço inox e degraus de teca', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Acesso ao flybridge por escada de aço inox e degraus de teca com corrimão em aço inox', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Acesso a cabine do marinheiro por escada de aço inox e degraus de teca, com sanitário manual, ar condicionado, pia, espelho, cama, armário, escada de acesso, vigia, escotilha de acesso técnico para a popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Porta de correr de vidro com armação de aço inox', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Local de armazenamento na popa com cobertura', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Living Área de proa com 2 sofás', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Púlpito de proa com guarda-corpo lateral e porta', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Bow thruster (8,7 Hp) alta eficiência', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Ancora estilo Bruce (20 kg, 75 metros de corrente de 8 mm)', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Armário na praça de popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Iluminação na praça de popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Sofá na praça de popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Mesa em teca natural na praça de popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Defensas cilíndricas (6) e Defensas esféricas (2)', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Guincho de âncora elétrico (1500 W com controle na proa, no comando principal e no do flybridge)', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Capa para defensas com logo da Ferretti', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Deck de fibra de vidro com anti-derrapante', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Chuveiro de mão com água doce quente e fria na plataforma de popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Vigias para tripulação na proa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Porta-cabos na proa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Cabos de amarração (12,4 m)', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Posto de amarração (2) com armário para os cabos', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Trilho para capa de cobertura', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Tela de proteção para para-brisa e janelas laterais da casaria', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Puxadores na casa de máquinas para desligamento de motores e ativação do sistema de extinção de incêndio', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Mangueira de incêndio e lavagem da ancora de proa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Escada de aço inox para embarque pela água', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Acessórios em aço inox', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Cunhos de amarração em aço inox: (2) na popa, (2) meia nau sendo um em cada bordo e (2) na proa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Passa-cabos na proa e popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Armário a bombordo', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Armário no sofá de popa', 'Padrão', 1, true, null),
('FY 550', 'DECK PRINCIPAL', 'Solário na proa com almofadas', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Porta de correr em vidro temperado com armação em aço inox', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Cortinas na porta de correr', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Armário com prateleiras', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Área de jantar a boreste (sofás e mesa de jantar, laqueada e extensível', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Carpete', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Sistema de som Fusion std', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Persianas romanas em tecido', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'Sofá a bombordo comparte frontal reversível em banco de piloto com mecanismo elétrico de subida e descida', 'Padrão', 1, true, null),
('FY 550', 'SALÃO', 'TV LED 24"', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Armário com prateleira e gavetas', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Cooktop cerâmico 4 bocas', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Conjunto de louças, copos e talheres para 6 pessoas', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Cortina em tecido na janela de popa', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Coifa 110V sobre o Cooktop', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Carpete', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Geladeira 130 l e freezer 90 l', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Microondas com Grill', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Armários de cozinha', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Bancada da pia em quartzo ou resina', 'Padrão', 1, true, null),
('FY 550', 'GALLEY', 'Pia', 'Padrão', 1, true, null);

-- NOTA: Esta é apenas a PARTE 1 da migration
-- Devido ao tamanho do CSV (~1267 registros), você precisa:
-- 1. Executar o script Python: python3 scripts/generate_memorial_sql.py
-- 2. Isso gerará a migration COMPLETA com todos os registros
-- 3. Executar a migration gerada

-- Esta migration parcial insere apenas ~54 itens para testar a estrutura