/*
  # Add Logo URL to Client Forms

  1. Changes
    - Adds logo_url column to client_forms table
    - Adds storage bucket for logos
    - Updates RLS policies for storage

  2. Security
    - Enables RLS for storage bucket
    - Adds policies for authenticated users to upload/manage logos
    - Adds policy for public to view logos
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