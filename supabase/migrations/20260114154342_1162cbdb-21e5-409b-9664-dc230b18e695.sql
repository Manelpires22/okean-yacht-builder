-- Fix PUBLIC_DATA_EXPOSURE: memorial_items table publicly readable with sensitive data
-- The memorial_items table contains detailed yacht component specifications, brands, models,
-- and technical data that could expose competitive information

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active memorial items" ON public.memorial_items;

-- Create a new policy requiring authentication
CREATE POLICY "Authenticated users can view active memorial items"
ON public.memorial_items FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);