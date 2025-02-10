/*
  # Update RLS policies for inventory items

  1. Changes
    - Drop existing update policy that restricts updates to item owner
    - Create new policy allowing any authenticated user to update items
    
  2. Security
    - Maintains read-only access for authenticated users
    - Allows any authenticated user to update items
    - Maintains existing insert and delete policies
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own inventory items" ON inventory_items;

-- Create new update policy that allows any authenticated user to update items
CREATE POLICY "Users can update any inventory item"
  ON inventory_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);