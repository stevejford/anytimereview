/*
  # Performance Improvements and Automated Timestamps

  1. Performance Indexes
    - Add index on slug for faster form lookups
    - Add index on business_name for search optimization
    - Add index on created_at for efficient sorting
  
  2. Automated Updates
    - Create trigger to maintain updated_at timestamp
    - Automatically updates timestamp on any row modification
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_forms_slug 
ON client_forms (slug);

CREATE INDEX IF NOT EXISTS idx_client_forms_business_name 
ON client_forms (business_name);

CREATE INDEX IF NOT EXISTS idx_client_forms_created_at 
ON client_forms (created_at DESC);

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_client_forms_updated_at'
    ) THEN
        CREATE TRIGGER set_client_forms_updated_at
        BEFORE UPDATE ON client_forms
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;