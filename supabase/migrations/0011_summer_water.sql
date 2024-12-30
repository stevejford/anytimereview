/*
  # Add Form Validation Constraints

  1. Changes
    - Adds validation constraints to client_forms table
    - Ensures webhook_url is a valid HTTPS URL
    - Ensures business_name is not empty
    - Ensures slug follows valid format

  2. Validation
    - Business name must be non-empty
    - Webhook URL must start with https://
    - Slug must be lowercase alphanumeric with hyphens
*/

-- Add check constraints for data validation
DO $$ 
BEGIN
  -- Add business_name validation
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_forms_business_name_check'
  ) THEN
    ALTER TABLE client_forms
    ADD CONSTRAINT client_forms_business_name_check
    CHECK (length(trim(business_name)) > 0);
  END IF;

  -- Add webhook_url validation
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_forms_webhook_url_check'
  ) THEN
    ALTER TABLE client_forms
    ADD CONSTRAINT client_forms_webhook_url_check
    CHECK (webhook_url ~ '^https://.*');
  END IF;

  -- Add slug format validation
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_forms_slug_format_check'
  ) THEN
    ALTER TABLE client_forms
    ADD CONSTRAINT client_forms_slug_format_check
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END $$;