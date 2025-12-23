-- Criar modelo OKEAN 80
INSERT INTO yacht_models (code, name, brand, base_price, base_delivery_days, is_active, display_order)
VALUES ('OKEAN80', 'OKEAN 80', 'OKEAN', 0, 365, true, 100);

-- Expandir coluna hull_number para suportar códigos completos como F55008, OK5227
ALTER TABLE hull_numbers ALTER COLUMN hull_number TYPE varchar(20);