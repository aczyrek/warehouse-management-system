/*
  # Add email queue table

  1. New Tables
    - `email_queue`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `to_email` (text)
      - `subject` (text)
      - `report_type` (text)
      - `report_data` (jsonb)
      - `status` (text)
      - `created_at` (timestamp)
      - `processed_at` (timestamp)

  2. Security
    - Enable RLS on `email_queue` table
    - Add policies for users to manage their own email queue entries
*/

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  report_type text NOT NULL,
  report_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text
);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own email queue"
  ON email_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into email queue"
  ON email_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);