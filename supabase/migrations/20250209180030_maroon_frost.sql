/*
  # Create inventory table

  1. New Tables
    - `inventory_items`
      - `id` (uuid, primary key)
      - `sku` (text, unique)
      - `name` (text)
      - `description` (text)
      - `quantity` (integer)
      - `location` (text)
      - `category` (text)
      - `minimum_stock` (integer)
      - `unit` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `inventory_items` table
    - Add policies for authenticated users to:
      - Read all items
      - Create new items
      - Update their own items
*/

CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 0,
  location text,
  category text,
  minimum_stock integer NOT NULL DEFAULT 0,
  unit text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all items
CREATE POLICY "Users can view all inventory items"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own items
CREATE POLICY "Users can add inventory items"
  ON inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own items
CREATE POLICY "Users can update their own inventory items"
  ON inventory_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);