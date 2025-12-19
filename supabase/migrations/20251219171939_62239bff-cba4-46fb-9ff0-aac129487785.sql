-- Add gallery_images column to yacht_models
ALTER TABLE yacht_models 
ADD COLUMN gallery_images JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN yacht_models.gallery_images IS 'Array of image URLs for the yacht model gallery';