/*
  # Remove email-related tables

  1. Changes
    - Drop email_queue table
    - Drop email_logs table
    - Drop email_templates table
*/

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS email_queue;
DROP TABLE IF EXISTS email_templates;

-- Drop indexes
DROP INDEX IF EXISTS idx_email_queue_status;
DROP INDEX IF EXISTS idx_email_queue_created_at;
DROP INDEX IF EXISTS idx_email_logs_queue_id;