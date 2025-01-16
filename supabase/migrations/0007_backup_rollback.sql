-- Rollback script to restore from backup
DO $$ 
BEGIN
    -- Restore client_forms
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'backup_client_forms') THEN
        TRUNCATE TABLE client_forms;
        INSERT INTO client_forms 
        SELECT * FROM backup_client_forms;
    END IF;

    -- Restore auth.users
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'backup_auth_users') THEN
        TRUNCATE TABLE auth.users;
        INSERT INTO auth.users 
        SELECT * FROM backup_auth_users;
    END IF;

    -- Restore policies
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'backup_policies') THEN
        FOR r IN (SELECT * FROM backup_policies) LOOP
            EXECUTE format(
                'CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s) WITH CHECK (%s)',
                r.policyname,
                r.schemaname,
                r.tablename,
                r.cmd,
                array_to_string(r.roles, ','),
                COALESCE(r.qual, 'true'),
                COALESCE(r.with_check, 'true')
            );
        END LOOP;
    END IF;
END $$; 