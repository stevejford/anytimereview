/*
  # Add logo support to client forms

  1. Changes
    - Adds logo_url column to client_forms table
    - Creates storage bucket for logos
    - Sets up RLS policies for logo storage

  2. Security
    - Public read access for logos
    - Authenticated users can manage logos
    - Storage bucket is public for viewing
*/

-- Add logo_url column
ALTER TABLE client_forms
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'logos', 'logos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'logos'
);

-- Enable RLS on the bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow public to view logos'
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow public to view logos"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'logos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated to manage logos'
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow authenticated to manage logos"
        ON storage.objects FOR ALL
        TO authenticated
        USING (bucket_id = 'logos')
        WITH CHECK (bucket_id = 'logos');
    END IF;
END $$;