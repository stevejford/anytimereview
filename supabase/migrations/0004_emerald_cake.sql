/*
  # Auth Settings Configuration

  1. Changes
    - Add email_confirmed_at column to auth.users if not exists
    - Set default value for email_confirmed_at to NOW()
*/

DO $$ 
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'email_confirmed_at'
  ) THEN
    ALTER TABLE auth.users 
    ADD COLUMN email_confirmed_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Ensure the column has the correct default
  ALTER TABLE auth.users
  ALTER COLUMN email_confirmed_at 
  SET DEFAULT NOW();
END $$;