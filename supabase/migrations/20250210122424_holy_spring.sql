/*
  # Add Location and Category Management

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `categories`
      - `id` (uuid, primary key) 
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Changes
    - Add foreign key constraints to inventory_items table
    - Update existing location and category columns to reference new tables
    
  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for locations
CREATE POLICY "Users can view all locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert locations"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for categories
CREATE POLICY "Users can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert existing locations and categories
INSERT INTO locations (name)
SELECT DISTINCT location 
FROM inventory_items 
WHERE location IS NOT NULL AND location != ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name)
SELECT DISTINCT category 
FROM inventory_items 
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;