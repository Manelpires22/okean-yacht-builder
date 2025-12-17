-- Add brand and model columns to options table
ALTER TABLE options ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE options ADD COLUMN IF NOT EXISTS model text;