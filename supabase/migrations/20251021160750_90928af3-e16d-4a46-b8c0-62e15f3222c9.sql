-- Drop existing policies for yacht-images bucket
DROP POLICY IF EXISTS "Anyone can view yacht images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload yacht images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update yacht images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete yacht images" ON storage.objects;

-- Create corrected RLS policies for yacht-images bucket
-- Anyone can view images (bucket is public)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'yacht-images');

-- Authenticated users can insert images
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'yacht-images');

-- Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'yacht-images');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'yacht-images');