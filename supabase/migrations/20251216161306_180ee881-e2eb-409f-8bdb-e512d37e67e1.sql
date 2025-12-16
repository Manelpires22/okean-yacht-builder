-- Inserir 14 opcionais específicos para OKEAN 57
INSERT INTO options (
  code, name, description, base_price, delivery_days_impact, 
  yacht_model_id, category_id, is_active
) VALUES
-- Eletrônicos & Navegação
('RAD-GARMIN-54-OK57', 'Radar Garmin GMR Fantom 54', 
 'Radar de estado sólido com alcance de 72nm, tecnologia MotionScope e capacidade de rastreamento de alvos', 
 45000, 15, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', '48211e61-d37f-4ff0-b2ef-1447b085a14f', true),

('PILOT-RAY-EVO-OK57', 'Piloto Automático Raymarine Evolution', 
 'Sistema de piloto automático com tecnologia EV sensoring, controle preciso em qualquer condição de mar', 
 28000, 10, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', '48211e61-d37f-4ff0-b2ef-1447b085a14f', true),

-- Conforto & Climatização
('AC-WEBASTO-T12-OK57', 'Ar-Condicionado Webasto Blue Cool T12', 
 'Sistema de ar-condicionado marinho 12.000 BTU com compressor DC inverter e baixo consumo', 
 35000, 12, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', '8d51e246-c725-47c5-892f-560bb2d5c957', true),

('GEN-ONAN-115-OK57', 'Gerador Diesel Onan 11.5kW', 
 'Gerador marinho diesel silencioso com sistema de refrigeração e baixa vibração', 
 85000, 20, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', '8d51e246-c725-47c5-892f-560bb2d5c957', true),

-- Entretenimento & Áudio
('SOM-JL-M6-OK57', 'Sistema de Som JL Audio Marine M6', 
 'Sistema completo com subwoofer, amplificador e speakers M6 resistentes à água salgada', 
 22000, 8, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'c3d3212b-23d4-40bc-955f-ab9e5f3dbc7a', true),

('TV-SAMSUNG-55-OK57', 'TV Samsung 55" QLED Outdoor', 
 'Smart TV 4K resistente a intempéries, brilho de 2000 nits para visualização externa', 
 18000, 7, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'c3d3212b-23d4-40bc-955f-ab9e5f3dbc7a', true),

-- Equipamentos Náuticos
('GUIN-BESEN-G450-OK57', 'Guindaste Besenzoni G450', 
 'Guindaste elétrico/hidráulico com capacidade de 450kg para lançamento de tender', 
 95000, 25, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', '1c87b4b5-8998-4693-bc9f-8f92cd285402', true),

('PASS-OPAC-HID-OK57', 'Passarela Hidráulica Opacmare', 
 'Passarela telescópica hidráulica em alumínio com 2.5m de extensão e controle remoto', 
 78000, 18, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', '1c87b4b5-8998-4693-bc9f-8f92cd285402', true),

-- Acabamentos & Design
('DECK-SEADEK-OK57', 'Deck em Teca Sintética SeaDek', 
 'Revestimento completo do cockpit em teca sintética EVA, sem manutenção e antiderrapante', 
 42000, 15, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'e3ac22d0-7de5-400c-a056-bb1189768999', true),

('LED-LUMI-AMB-OK57', 'Iluminação LED Ambiente Lumishore', 
 'Sistema de iluminação LED subaquática e de ambiente com controle RGB via app', 
 25000, 10, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'e3ac22d0-7de5-400c-a056-bb1189768999', true),

-- Segurança & Equipamentos
('CAM-FLIR-M364-OK57', 'Câmera Térmica FLIR M364C', 
 'Câmera térmica giroestabilizada com visão noturna e rastreamento automático', 
 65000, 14, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'f13ff5bb-281f-49d4-bc9d-cd90f8265087', true),

('BALSA-VIKING-6P-OK57', 'Balsa Salva-Vidas Viking 6 Pessoas', 
 'Balsa auto-inflável homologada SOLAS para 6 pessoas com kit de sobrevivência', 
 12000, 5, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'f13ff5bb-281f-49d4-bc9d-cd90f8265087', true),

-- Motores & Performance
('ESTAB-SEAKEEPER9-OK57', 'Estabilizador Seakeeper 9', 
 'Sistema de estabilização giroscópica para barcos de 40 a 60 pés, elimina até 95% do balanço', 
 180000, 30, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'b974ab80-31a3-4303-8bf9-b2064eda76a3', true),

('HELICE-FLEXO-3B-OK57', 'Hélices Flexofold 3-Blade', 
 'Hélices dobráveis de 3 pás em bronze, reduzem arrasto e aumentam eficiência de navegação', 
 38000, 12, 'aad0cf05-c32e-4078-897f-2a6db49a9f4f', 'b974ab80-31a3-4303-8bf9-b2064eda76a3', true);