-- Add registration_number and delivery_date to yacht_models
ALTER TABLE yacht_models 
ADD COLUMN registration_number varchar,
ADD COLUMN delivery_date date;

-- Add indexes for better query performance
CREATE INDEX idx_yacht_models_registration ON yacht_models(registration_number);
CREATE INDEX idx_yacht_models_delivery_date ON yacht_models(delivery_date);