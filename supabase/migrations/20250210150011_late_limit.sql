-- Add an index on user_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add a policy to handle upserts properly
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can upsert their own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update the trigger to handle null values
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  -- Ensure we don't override existing values with nulls
  NEW.company_name = COALESCE(NEW.company_name, OLD.company_name);
  NEW.notifications = COALESCE(NEW.notifications, OLD.notifications);
  NEW.warehouse = COALESCE(NEW.warehouse, OLD.warehouse);
  NEW.security = COALESCE(NEW.security, OLD.security);
  RETURN NEW;
END;
$$ language 'plpgsql';