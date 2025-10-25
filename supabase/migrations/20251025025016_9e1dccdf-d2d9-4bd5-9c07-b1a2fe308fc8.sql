-- Inserir categorias de opcionais
INSERT INTO option_categories (name, description, display_order, is_active) VALUES
('Eletrônicos & Navegação', 'Radares, GPS, pilotos automáticos e sistemas de navegação', 1, true),
('Conforto & Climatização', 'Ar-condicionado, aquecedores e geradores', 2, true),
('Entretenimento & Áudio', 'TVs, sistemas de som e home theater', 3, true),
('Equipamentos Náuticos', 'Guindastes, passarelas, tenders e equipamentos de manobra', 4, true),
('Acabamentos & Design', 'Teca, iluminação e revestimentos premium', 5, true),
('Segurança & Equipamentos', 'Sistemas anti-incêndio, botes salva-vidas e câmeras', 6, true),
('Motores & Performance', 'Propulsores, estabilização e hélices', 7, true);

-- Inserir opcionais genéricos (aparecem em todos os modelos)
INSERT INTO options (code, name, description, category_id, base_price, delivery_days_impact, yacht_model_id, is_active)
VALUES
-- Eletrônicos & Navegação (genéricos)
('RADAR-FUR-DRS4W', 'Radar Furuno DRS4W', 'Radar de última geração com tecnologia doppler para detecção precisa', (SELECT id FROM option_categories WHERE name = 'Eletrônicos & Navegação'), 45000, 7, NULL, true),
('PILOT-GAR-R40', 'Piloto Automático Garmin Reactor 40', 'Sistema de piloto automático com controle hidráulico de alta performance', (SELECT id FROM option_categories WHERE name = 'Eletrônicos & Navegação'), 35000, 5, NULL, true),
('CAM-360', 'Sistema de Câmeras de Manobra 360°', 'Sistema completo de câmeras com visão panorâmica para manobras', (SELECT id FROM option_categories WHERE name = 'Eletrônicos & Navegação'), 12000, 2, NULL, true),

-- Conforto & Climatização (genéricos)
('AC-18K', 'Ar-Condicionado Adicional 18.000 BTU', 'Unidade split adicional para maior conforto térmico', (SELECT id FROM option_categories WHERE name = 'Conforto & Climatização'), 15000, 10, NULL, true),
('HEAT-60L', 'Aquecedor de Água 60L', 'Boiler elétrico de 60 litros para água quente', (SELECT id FROM option_categories WHERE name = 'Conforto & Climatização'), 8500, 3, NULL, true),

-- Entretenimento & Áudio (genéricos)
('AUDIO-FUS-RA770', 'Sistema de Som Fusion Apollo RA770', 'Central multimídia náutica com conectividade Bluetooth e Wi-Fi', (SELECT id FROM option_categories WHERE name = 'Entretenimento & Áudio'), 22000, 5, NULL, true),

-- Equipamentos Náuticos (genéricos)
('GANGWAY-3M-CARB', 'Passarela Hidráulica 3m Carbono', 'Passarela telescópica em fibra de carbono com acionamento hidráulico', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 42000, 15, NULL, true),
('TENDER-ZOD-340', 'Tender Zodiac 3.40m + Motor Yamaha 15HP', 'Bote inflável Zodiac com motor de popa Yamaha', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 38000, 10, NULL, true),

-- Acabamentos & Design (genéricos)
('TEAK-DECK-M2', 'Teca Deck Premium (por m²)', 'Aplicação de teca natural premium no deck', (SELECT id FROM option_categories WHERE name = 'Acabamentos & Design'), 3500, 30, NULL, true),
('LED-UNDERWATER-RGB', 'Iluminação LED Subaquática RGB', 'Sistema de iluminação LED RGB controlável via smartphone', (SELECT id FROM option_categories WHERE name = 'Acabamentos & Design'), 18000, 7, NULL, true),

-- Segurança & Equipamentos (genéricos)
('FIRE-AUTO', 'Sistema Anti-Incêndio Automático', 'Sistema automatizado de detecção e extinção de incêndio', (SELECT id FROM option_categories WHERE name = 'Segurança & Equipamentos'), 25000, 12, NULL, true),

-- Motores & Performance (genéricos)
('STAB-SEAKEEP-6', 'Sistema de Estabilização Seakeeper 6', 'Giroscópio de estabilização para máximo conforto em navegação', (SELECT id FROM option_categories WHERE name = 'Motores & Performance'), 180000, 30, NULL, true);

-- Inserir opcionais específicos para modelos grandes (FY850, FY1000, FY720)
INSERT INTO options (code, name, description, category_id, base_price, delivery_days_impact, yacht_model_id, is_active)
VALUES
('GPS-GAR-8617', 'GPS Chartplotter Garmin GPSMAP 8617 17"', 'Plotter multifuncional de 17 polegadas com cartas náuticas', (SELECT id FROM option_categories WHERE name = 'Eletrônicos & Navegação'), 28000, 3, (SELECT id FROM yacht_models WHERE code = 'FY850'), true),
('GPS-GAR-8617-FY1000', 'GPS Chartplotter Garmin GPSMAP 8617 17"', 'Plotter multifuncional de 17 polegadas com cartas náuticas', (SELECT id FROM option_categories WHERE name = 'Eletrônicos & Navegação'), 28000, 3, (SELECT id FROM yacht_models WHERE code = 'FY1000'), true),
('GPS-GAR-8617-FY720', 'GPS Chartplotter Garmin GPSMAP 8617 17"', 'Plotter multifuncional de 17 polegadas com cartas náuticas', (SELECT id FROM option_categories WHERE name = 'Eletrônicos & Navegação'), 28000, 3, (SELECT id FROM yacht_models WHERE code = 'FY720'), true),

('HT-BOSE-650', 'Home Theater Bose Lifestyle 650', 'Sistema de áudio premium 5.1 canais Bose', (SELECT id FROM option_categories WHERE name = 'Entretenimento & Áudio'), 35000, 7, (SELECT id FROM yacht_models WHERE code = 'FY850'), true),
('HT-BOSE-650-FY1000', 'Home Theater Bose Lifestyle 650', 'Sistema de áudio premium 5.1 canais Bose', (SELECT id FROM option_categories WHERE name = 'Entretenimento & Áudio'), 35000, 7, (SELECT id FROM yacht_models WHERE code = 'FY1000'), true),

('LEATHER-PREM', 'Revestimento Interno Couro Premium', 'Revestimento completo em couro bovino premium', (SELECT id FROM option_categories WHERE name = 'Acabamentos & Design'), 45000, 25, (SELECT id FROM yacht_models WHERE code = 'FY850'), true),
('LEATHER-PREM-FY1000', 'Revestimento Interno Couro Premium', 'Revestimento completo em couro bovino premium', (SELECT id FROM option_categories WHERE name = 'Acabamentos & Design'), 45000, 25, (SELECT id FROM yacht_models WHERE code = 'FY1000'), true),
('LEATHER-PREM-FY720', 'Revestimento Interno Couro Premium', 'Revestimento completo em couro bovino premium', (SELECT id FROM option_categories WHERE name = 'Acabamentos & Design'), 45000, 25, (SELECT id FROM yacht_models WHERE code = 'FY720'), true);

-- Inserir opcionais específicos para modelos médios/grandes (FY670, FY720, FY850, FY1000)
INSERT INTO options (code, name, description, category_id, base_price, delivery_days_impact, yacht_model_id, is_active)
VALUES
('GEN-ONAN-17', 'Gerador Onan 17.5kW', 'Gerador diesel Onan de 17.5kW com sistema de insonorização', (SELECT id FROM option_categories WHERE name = 'Conforto & Climatização'), 65000, 15, (SELECT id FROM yacht_models WHERE code = 'FY670'), true),
('GEN-ONAN-17-FY720', 'Gerador Onan 17.5kW', 'Gerador diesel Onan de 17.5kW com sistema de insonorização', (SELECT id FROM option_categories WHERE name = 'Conforto & Climatização'), 65000, 15, (SELECT id FROM yacht_models WHERE code = 'FY720'), true),
('GEN-ONAN-17-FY850', 'Gerador Onan 17.5kW', 'Gerador diesel Onan de 17.5kW com sistema de insonorização', (SELECT id FROM option_categories WHERE name = 'Conforto & Climatização'), 65000, 15, (SELECT id FROM yacht_models WHERE code = 'FY850'), true),
('GEN-ONAN-17-FY1000', 'Gerador Onan 17.5kW', 'Gerador diesel Onan de 17.5kW com sistema de insonorização', (SELECT id FROM option_categories WHERE name = 'Conforto & Climatização'), 65000, 15, (SELECT id FROM yacht_models WHERE code = 'FY1000'), true),

('TV-55-SAMSUNG', 'TV 55" Samsung Náutica 4K', 'Televisor 55 polegadas 4K com proteção contra maresia', (SELECT id FROM option_categories WHERE name = 'Entretenimento & Áudio'), 12000, 2, (SELECT id FROM yacht_models WHERE code = 'FY670'), true),
('TV-55-SAMSUNG-FY720', 'TV 55" Samsung Náutica 4K', 'Televisor 55 polegadas 4K com proteção contra maresia', (SELECT id FROM option_categories WHERE name = 'Entretenimento & Áudio'), 12000, 2, (SELECT id FROM yacht_models WHERE code = 'FY720'), true),
('TV-55-SAMSUNG-FY850', 'TV 55" Samsung Náutica 4K', 'Televisor 55 polegadas 4K com proteção contra maresia', (SELECT id FROM option_categories WHERE name = 'Entretenimento & Áudio'), 12000, 2, (SELECT id FROM yacht_models WHERE code = 'FY850'), true),
('TV-55-SAMSUNG-FY1000', 'TV 55" Samsung Náutica 4K', 'Televisor 55 polegadas 4K com proteção contra maresia', (SELECT id FROM option_categories WHERE name = 'Entretenimento & Áudio'), 12000, 2, (SELECT id FROM yacht_models WHERE code = 'FY1000'), true),

('CRANE-HYD-500', 'Guindaste Hidráulico 500kg', 'Guindaste hidráulico com capacidade de 500kg para movimentação de tender', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 55000, 20, (SELECT id FROM yacht_models WHERE code = 'FY670'), true),
('CRANE-HYD-500-FY720', 'Guindaste Hidráulico 500kg', 'Guindaste hidráulico com capacidade de 500kg para movimentação de tender', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 55000, 20, (SELECT id FROM yacht_models WHERE code = 'FY720'), true),
('CRANE-HYD-500-FY850', 'Guindaste Hidráulico 500kg', 'Guindaste hidráulico com capacidade de 500kg para movimentação de tender', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 55000, 20, (SELECT id FROM yacht_models WHERE code = 'FY850'), true),
('CRANE-HYD-500-FY1000', 'Guindaste Hidráulico 500kg', 'Guindaste hidráulico com capacidade de 500kg para movimentação de tender', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 55000, 20, (SELECT id FROM yacht_models WHERE code = 'FY1000'), true),

('LIFEBOAT-8P', 'Bote Salva-Vidas Inflável 8 Pessoas', 'Bote salva-vidas inflável homologado para 8 pessoas', (SELECT id FROM option_categories WHERE name = 'Segurança & Equipamentos'), 15000, 5, (SELECT id FROM yacht_models WHERE code = 'FY670'), true),
('LIFEBOAT-8P-FY720', 'Bote Salva-Vidas Inflável 8 Pessoas', 'Bote salva-vidas inflável homologado para 8 pessoas', (SELECT id FROM option_categories WHERE name = 'Segurança & Equipamentos'), 15000, 5, (SELECT id FROM yacht_models WHERE code = 'FY720'), true),
('LIFEBOAT-8P-FY850', 'Bote Salva-Vidas Inflável 8 Pessoas', 'Bote salva-vidas inflável homologado para 8 pessoas', (SELECT id FROM option_categories WHERE name = 'Segurança & Equipamentos'), 15000, 5, (SELECT id FROM yacht_models WHERE code = 'FY850'), true),
('LIFEBOAT-8P-FY1000', 'Bote Salva-Vidas Inflável 8 Pessoas', 'Bote salva-vidas inflável homologado para 8 pessoas', (SELECT id FROM option_categories WHERE name = 'Segurança & Equipamentos'), 15000, 5, (SELECT id FROM yacht_models WHERE code = 'FY1000'), true);

-- Inserir opcionais específicos para modelos menores/médios (FY550, OKEAN52, OKEAN57, FY670)
INSERT INTO options (code, name, description, category_id, base_price, delivery_days_impact, yacht_model_id, is_active)
VALUES
('WINCH-LEWMAR-V3', 'Winch Elétrico Lewmar V3 GD', 'Guincho elétrico para içar âncora com controle remoto', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 18000, 5, (SELECT id FROM yacht_models WHERE code = 'FY550'), true),
('WINCH-LEWMAR-V3-OK52', 'Winch Elétrico Lewmar V3 GD', 'Guincho elétrico para içar âncora com controle remoto', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 18000, 5, (SELECT id FROM yacht_models WHERE code = 'OKEAN52'), true),
('WINCH-LEWMAR-V3-OK57', 'Winch Elétrico Lewmar V3 GD', 'Guincho elétrico para içar âncora com controle remoto', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 18000, 5, (SELECT id FROM yacht_models WHERE code = 'OKEAN57'), true),
('WINCH-LEWMAR-V3-FY670', 'Winch Elétrico Lewmar V3 GD', 'Guincho elétrico para içar âncora com controle remoto', (SELECT id FROM option_categories WHERE name = 'Equipamentos Náuticos'), 18000, 5, (SELECT id FROM yacht_models WHERE code = 'FY670'), true);