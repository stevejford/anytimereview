/*
  # Create admin user

  1. Changes
    - Creates an admin user with email admin@example.com if it doesn't exist
    - Sets up necessary metadata and authentication details
    - Ensures email confirmation is set

  2. Security
    - Password is hashed using bcrypt
    - User is given authenticated role
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