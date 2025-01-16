-- Enable RLS
ALTER TABLE client_forms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own forms" ON client_forms;
DROP POLICY IF EXISTS "Admins can view all forms" ON client_forms;

-- Policy for form owners
CREATE POLICY "Users can view their own forms"
ON client_forms
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for admins
CREATE POLICY "Admins can view all forms"
ON client_forms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role = 'admin'
  )
); 