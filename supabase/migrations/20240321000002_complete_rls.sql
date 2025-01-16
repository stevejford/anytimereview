-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own forms" ON client_forms;
DROP POLICY IF EXISTS "Admins can view all forms" ON client_forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON client_forms;
DROP POLICY IF EXISTS "Admins can update all forms" ON client_forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON client_forms;
DROP POLICY IF EXISTS "Admins can delete all forms" ON client_forms;
DROP POLICY IF EXISTS "Users can insert forms" ON client_forms;

-- Policy for viewing forms
CREATE POLICY "Users can view their own forms"
ON client_forms FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all forms"
ON client_forms FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for updating forms
CREATE POLICY "Users can update their own forms"
ON client_forms FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all forms"
ON client_forms FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for deleting forms
CREATE POLICY "Users can delete their own forms"
ON client_forms FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all forms"
ON client_forms FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy for inserting forms
CREATE POLICY "Users can insert forms"
ON client_forms FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND role = 'admin'
    )
); 