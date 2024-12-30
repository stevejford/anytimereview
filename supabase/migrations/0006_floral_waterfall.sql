/*
  # Update Client Forms Policies
  
  1. Changes
    - Safely drops and recreates policies to ensure correct state
    - Preserves existing table structure
  
  2. Security
    - Maintains RLS policies for authenticated users (CRUD)
    - Maintains public read access by slug
*/

-- Drop and recreate policies safely
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_forms' AND policyname = 'Allow authenticated users to read forms') THEN
    DROP POLICY "Allow authenticated users to read forms" ON client_forms;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_forms' AND policyname = 'Allow authenticated users to insert forms') THEN
    DROP POLICY "Allow authenticated users to insert forms" ON client_forms;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_forms' AND policyname = 'Allow authenticated users to update forms') THEN
    DROP POLICY "Allow authenticated users to update forms" ON client_forms;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_forms' AND policyname = 'Allow authenticated users to delete forms') THEN
    DROP POLICY "Allow authenticated users to delete forms" ON client_forms;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_forms' AND policyname = 'Allow public to read forms by slug') THEN
    DROP POLICY "Allow public to read forms by slug" ON client_forms;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Allow authenticated users to read forms"
  ON client_forms FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert forms"
  ON client_forms FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update forms"
  ON client_forms FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete forms"
  ON client_forms FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Allow public to read forms by slug"
  ON client_forms FOR SELECT TO anon
  USING (true);