-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the function with better null handling
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    -- Preserve existing values if new values are null
    NEW.company_name = COALESCE(NEW.company_name, OLD.company_name);
    NEW.notifications = COALESCE(NEW.notifications, OLD.notifications);
    NEW.warehouse = COALESCE(NEW.warehouse, OLD.warehouse);
    NEW.security = COALESCE(NEW.security, OLD.security);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to handle upsert properly
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

-- Create a single policy for upsert
CREATE POLICY "Users can upsert their own settings"
    ON user_settings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);