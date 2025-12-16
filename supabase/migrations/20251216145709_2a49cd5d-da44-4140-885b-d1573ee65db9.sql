-- Reestruturar tabela job_stops com 3 colunas de negócio

-- Adicionar novas colunas
ALTER TABLE job_stops ADD COLUMN stage TEXT;
ALTER TABLE job_stops ADD COLUMN days_limit INTEGER;

-- Renomear 'name' para 'item_name'
ALTER TABLE job_stops RENAME COLUMN name TO item_name;

-- Remover coluna 'description' (será substituída pelo concat das 3 colunas)
ALTER TABLE job_stops DROP COLUMN description;

-- Limpar registros antigos
DELETE FROM job_stops;

-- Inserir os 29 novos itens de Job-Stop
INSERT INTO job_stops (stage, days_limit, item_name, display_order, is_active) VALUES
('JS1', 300, 'Motorização', 1, true),
('JS2', 120, 'Assento Llebroc e Osculati', 2, true),
('JS2', 120, 'Material Flexiteek', 3, true),
('JS2', 120, 'Material Maciço Teka', 4, true),
('JS2', 120, 'Eletrônicos', 5, true),
('JS2', 120, 'Gabinete gourmet Fly (52)', 6, true),
('JS2', 120, 'Mercado', 7, true),
('JS2', 120, 'Pintura de fundo', 8, true),
('JS2', 120, 'Estabilizador Seakeeper', 9, true),
('JS2', 120, 'Sonorização', 10, true),
('JS2', 120, 'Revestimento importado WC', 11, true),
('JS2', 120, 'Móveis (F550)', 12, true),
('JS3', 90, 'Pintura especial', 13, true),
('JS3', 90, 'Pintura Casaria', 14, true),
('JS3', 90, 'Cor HardTop / Bimini / Stobag', 15, true),
('JS3', 90, 'Pintura Flybridge', 16, true),
('JS3', 90, 'Pintura Casco', 17, true),
('JS3', 90, 'Pintura Convés', 18, true),
('JS3', 90, 'Tecido decor importado', 19, true),
('JS3', 90, 'Móveis (OK52 e OK57)', 20, true),
('JS3', 90, 'Desenvolvimento chiller', 21, true),
('JS4', 60, 'Revestimento nacional WC', 22, true),
('JS4', 60, 'Tecido decor nacional', 23, true),
('JS4', 60, 'Pintura Propspeed', 24, true),
('JS4', 60, 'Pintura linha beleza', 25, true),
('JS4', 60, 'Tampos em Pedra', 26, true),
('JS4', 60, 'Mesa popa, proa, salão ou FLY em Teca', 27, true),
('JS4', 60, 'Lona Sombreamento', 28, true),
('JS4', 60, 'Enxoval', 29, true),
('JS4', 60, 'Dessalinizador nacional', 30, true);