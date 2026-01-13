-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: memorial_items (2001 rows)
-- Generated: 2026-01-13
-- =============================================

SET NOCOUNT ON;
GO

-- =============================================
-- NOTA IMPORTANTE
-- =============================================
-- Esta tabela contém 2001 registros do memorial descritivo.
-- Por questões de tamanho, este arquivo contém uma amostra.
--
-- Para migração completa, use:
-- 1. Exportar via CSV: node scripts/export-data-for-sqlserver.js
-- 2. Importar via BULK INSERT no SQL Server
--
-- Abaixo está uma amostra representativa dos dados:
-- =============================================

-- =============================================
-- INSERT DATA: memorial_items (sample - 50 registros)
-- =============================================

INSERT INTO [dbo].[memorial_items] ([id], [yacht_model_id], [category], [category_id], [category_display_order], [item_name], [description], [code], [brand], [model], [quantity], [unit], [display_order], [is_active], [is_customizable], [is_configurable], [has_upgrades], [image_url], [images], [technical_specs], [configurable_sub_items], [job_stop_id], [created_by], [created_at], [updated_at])
VALUES 
  -- Salão - FY1000
  ('c38b98ac-fe6f-41da-8a0c-14896058d345', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'Cozinha em formato de U com bancada em Corian.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 1, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('c30c81b5-67ff-4305-bb35-cd69335a283c', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'Janela corrediça com moldura de aço inoxidável que abre para o passadiço.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 2, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('6c73d594-c55e-4e0e-bb77-92bf5c380574', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'Bancada de fibra dobrável sob a janela da cozinha ao bordo BB.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 3, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('085ef734-d8f3-4045-a534-01033ced6980', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'Piso da cozinha e salão em vinil laminado.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 4, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('3231932c-9441-4b94-a308-af2b00fbdda0', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'Torneira de água quente-fria de aço inoxidável e pia de aço inoxidável.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 5, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('3c217d7e-f97f-4270-b935-094d64f3d45b', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'Luzes LED suspensas no teto.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 6, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('9db4df80-3f97-4863-8dee-0f4e9f1c3cec', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'Microondas.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 7, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('f7c455b1-35cf-4e55-a6a4-b0553af83cf1', '00475e39-18eb-4730-9399-536572b37163', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, N'(1) Refrigerador - 130L e (1) freezer – 90L cada sob o balcão.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 8, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Cabine Tripulação
  ('659ae57b-fbfb-46df-b0e3-5eeceb5a6dcd', '45d9b1e4-67da-4239-829a-c3568155878f', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 7, N'Acesso ao deque principal por escada de aço inox e degraus de teca', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 69, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('f67c93c2-ce8f-4d91-91be-206b82e1d966', '45d9b1e4-67da-4239-829a-c3568155878f', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 319, N'Cama', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 72, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('6d45564d-c112-4a6d-b931-3f54e1c2b972', '45d9b1e4-67da-4239-829a-c3568155878f', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 319, N'Vaso sanitário manual', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 73, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Sistema Ar Condicionado
  ('5333aed8-c8d0-4a16-9b4a-33ef46888d68', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Cadeiras tipo diretor para o cockpit (2)', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 53, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('6a25d558-a754-47d5-8482-ba394affcf2d', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Luzes submergíveis (7)', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 54, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('3d3ce1b2-c65d-4e89-87b0-9e2010b9c149', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Icemaker no cockpit', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 55, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('73a1921c-e3d8-4d14-ad7e-b87434efc03c', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Lava-louças', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 56, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('79a26e7c-9407-4b7f-adb1-64ec24f2ed2b', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Paredes do banheiro da cabine master revestidas em calacata', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 57, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Salão - FY580
  ('62909dfb-81e6-4ca9-bd7f-12e0d1a25ded', '45d9b1e4-67da-4239-829a-c3568155878f', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, N'Carpete', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 5, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('425bb8af-d120-4eb2-a463-fffb1c52fa8e', '45d9b1e4-67da-4239-829a-c3568155878f', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, N'Sistema de som Fusion std', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 6, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('7eddf766-7697-4413-98c1-2ed135bc140c', '45d9b1e4-67da-4239-829a-c3568155878f', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, N'Persianas romanas em tecido', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 7, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('dc0922a4-0f5c-419c-8985-ec2ab1cb6c72', '45d9b1e4-67da-4239-829a-c3568155878f', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, N'Sofá a bombordo comparte frontal reversível em banco de piloto com mecanismo elétrico de subida e descida', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 8, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('19bddce2-fa90-416b-bfe8-8f3424500a19', '45d9b1e4-67da-4239-829a-c3568155878f', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, N'TV LED 24"', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 9, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Cabine Tripulação - FY1000
  ('531dcc74-2541-4bdf-9f7e-c534919e9aa8', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, N'Ar-condicionado', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 1, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('15c0d0c1-5b3c-43fb-8855-e9a565c79d30', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, N'Camas (2) com colchões, travesseiros e cobertores', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 2, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('1ca163d9-d7a9-4bfb-b789-e247371767ad', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, N'Cortina', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 3, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('5a74ebc8-7cb5-4027-bf0f-e2e4841fc673', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, N'Carpete embutido', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 4, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('6b3ad663-531b-49f9-aa84-f1efc70e5fcd', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, N'Vigia de aço inoxidável com abertura', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 5, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('c9ce323a-d75c-4ecb-860b-6b374eeb213b', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, N'Guarda-roupa', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 6, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Pintura
  ('a59d58ca-1e46-4956-86d2-652faee4f04e', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Pintura cinza no domo vazio', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 58, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('9f326b17-262c-4f9d-a08e-35b854191b2c', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Pintura cinza na antena de radar Radome', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 59, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('f0a700e4-29dd-490c-9151-294ac9751c43', '4c501b04-12da-46f7-8e10-16c5bc34910f', N'sistema_ar_condicionado', 'b6215845-aaf8-47d5-8c81-950d2ae43d4c', 1685, N'Pintura cinza na buzina', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 60, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Salão - FY1000
  ('36ba8b2d-e813-4cad-b06b-d279ef57ad79', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, N'Piso vinílico', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 34, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  ('ff050a88-8bfd-4bfd-b398-c6aa97f515a7', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', N'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, N'Janela com vigia de aço inoxidável que pode ser aberta', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 35, 1, 1, 0, 0, NULL, N'[]', NULL, N'[]', NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075');
GO

-- =============================================
-- INSTRUÇÃO PARA EXPORTAR DADOS COMPLETOS
-- =============================================
-- Execute no Supabase SQL Editor:
--
-- SELECT 
--   id, yacht_model_id, category, category_id, category_display_order,
--   item_name, description, code, brand, model, quantity, unit,
--   display_order, is_active, is_customizable, is_configurable,
--   has_upgrades, image_url, images::text, technical_specs::text,
--   configurable_sub_items::text, job_stop_id, created_by,
--   created_at, updated_at
-- FROM memorial_items
-- ORDER BY yacht_model_id, category_id, display_order;
--
-- Então exporte como CSV e importe via BULK INSERT.
-- =============================================

-- =============================================
-- Done!
-- =============================================
