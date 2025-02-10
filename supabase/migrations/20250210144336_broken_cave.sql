/*
  # Add notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text)
      - `message` (text)
      - `read` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to manage their own notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Get the test user's ID
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'test@wareflow.com'
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    -- Insert sample notifications for the test user
    INSERT INTO notifications (user_id, type, message)
    VALUES
      (test_user_id, 'alert', 'Low stock alert: Laptop-001'),
      (test_user_id, 'info', 'New inventory items added'),
      (test_user_id, 'success', 'Stock count completed');
  END IF;
END $$;