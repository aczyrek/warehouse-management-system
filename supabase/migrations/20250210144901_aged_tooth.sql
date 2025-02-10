/*
  # Fix notifications policies

  1. Changes
    - Add INSERT policy for notifications table to allow authenticated users to create notifications
*/

-- Add insert policy for notifications
CREATE POLICY "Users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add delete policy for notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);