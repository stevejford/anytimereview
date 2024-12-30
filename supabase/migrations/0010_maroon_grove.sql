/*
  # Add Default Admin User

  1. Changes
    - Creates a default admin user if it doesn't exist
    - Sets up initial authentication credentials
    - Confirms email automatically

  2. Security
    - Uses secure password hashing with bcrypt
    - Sets appropriate user metadata and roles
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM auth.users 
    WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token
    ) VALUES (
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin"}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      ''
    );
  END IF;
END $$;