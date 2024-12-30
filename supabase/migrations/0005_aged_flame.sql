/*
  # Client Forms and Policies Setup

  1. Tables
    - client_forms
      - id (uuid, primary key)
      - business_name (text)
      - webhook_url (text)
      - slug (text, unique)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on client_forms
    - Policies for authenticated users (CRUD operations)
    - Policy for public read access by slug
*/

-- Create client_forms table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'client_forms'
  ) THEN
    CREATE TABLE client_forms (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_name text NOT NULL,
      webhook_url text NOT NULL,
      slug text UNIQUE NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE client_forms ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Allow authenticated users to read forms"
      ON client_forms
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Allow authenticated users to insert forms"
      ON client_forms
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Allow authenticated users to update forms"
      ON client_forms
      FOR UPDATE
      TO authenticated
      USING (true);

    CREATE POLICY "Allow authenticated users to delete forms"
      ON client_forms
      FOR DELETE
      TO authenticated
      USING (true);

    CREATE POLICY "Allow public to read forms by slug"
      ON client_forms
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;