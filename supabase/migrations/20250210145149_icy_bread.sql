/*
  # Set up email processing system

  1. Changes
    - Create email_templates table for storing report email templates
    - Create email_logs table for tracking email sending attempts
    - Add indexes for better query performance
*/

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id uuid REFERENCES email_queue(id),
  attempt_number integer NOT NULL DEFAULT 1,
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_queue_id ON email_logs(email_queue_id);

-- Insert default email templates
INSERT INTO email_templates (name, subject_template, body_template)
VALUES
  (
    'inventory_report',
    'Inventory Summary Report - {{date}}',
    'Dear {{user_name}},

Please find attached the inventory summary report you requested.

Best regards,
WareFlow Team'
  ),
  (
    'low_stock_report',
    'Low Stock Report - {{date}}',
    'Dear {{user_name}},

Please find attached the low stock report you requested.

Best regards,
WareFlow Team'
  ),
  (
    'activity_report',
    'Activity Log Report - {{date}}',
    'Dear {{user_name}},

Please find attached the activity log report you requested.

Best regards,
WareFlow Team'
  )
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM email_queue
    WHERE email_queue.id = email_logs.email_queue_id
    AND email_queue.user_id = auth.uid()
  ));