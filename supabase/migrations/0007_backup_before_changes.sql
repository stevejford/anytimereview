-- Backup of current tables and data
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Save client_forms data
    CREATE TABLE IF NOT EXISTS backup_client_forms AS 
    SELECT * FROM client_forms;

    -- Save auth.users data
    CREATE TABLE IF NOT EXISTS backup_auth_users AS 
    SELECT * FROM auth.users;

    -- Save any existing RLS policies
    FOR r IN (SELECT * FROM pg_policies) LOOP
        -- Store policy definitions in a backup table
        CREATE TABLE IF NOT EXISTS backup_policies (
            schemaname text,
            tablename text,
            policyname text,
            roles text[],
            cmd text,
            qual text,
            with_check text
        );
        
        INSERT INTO backup_policies 
        VALUES (
            r.schemaname,
            r.tablename,
            r.policyname,
            r.roles,
            r.cmd,
            r.qual::text,
            r.with_check::text
        );
    END LOOP;
END $$; 