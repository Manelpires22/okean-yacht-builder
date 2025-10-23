-- Add new technical specification fields to yacht_models
ALTER TABLE yacht_models
ADD COLUMN hull_length numeric,
ADD COLUMN engines text,
ADD COLUMN hull_color varchar,
ADD COLUMN displacement_light numeric,
ADD COLUMN displacement_loaded numeric,
ADD COLUMN cabins integer,
ADD COLUMN bathrooms varchar;

-- Add comments for documentation
COMMENT ON COLUMN yacht_models.hull_length IS 'Comprimento do casco em metros';
COMMENT ON COLUMN yacht_models.engines IS 'Descrição completa da motorização';
COMMENT ON COLUMN yacht_models.hull_color IS 'Cor do costado/casco';
COMMENT ON COLUMN yacht_models.displacement_light IS 'Deslocamento descarregado em kg';
COMMENT ON COLUMN yacht_models.displacement_loaded IS 'Deslocamento carregado em kg';
COMMENT ON COLUMN yacht_models.cabins IS 'Número de cabines';
COMMENT ON COLUMN yacht_models.bathrooms IS 'Número de banheiros (ex: 3+1)';