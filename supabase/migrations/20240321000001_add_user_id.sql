-- Part 1: Add the column and update existing data
ALTER TABLE client_forms 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Find an existing user and set as admin
DO $$ 
DECLARE
    admin_id UUID;
BEGIN
    -- First try to get an existing admin user
    SELECT user_id INTO admin_id
    FROM user_roles
    WHERE role = 'admin'
    LIMIT 1;

    -- If no admin exists, get the first user from auth.users
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id
        FROM auth.users
        LIMIT 1;

        -- Make this user an admin if they aren't already
        INSERT INTO user_roles (user_id, role)
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Update all NULL user_id rows with the admin_id
    IF admin_id IS NOT NULL THEN
        UPDATE client_forms 
        SET user_id = admin_id 
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Part 2: Now that all rows have a user_id, make it NOT NULL
ALTER TABLE client_forms 
ALTER COLUMN user_id SET NOT NULL; 