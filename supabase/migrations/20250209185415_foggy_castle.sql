/*
  # Add inventory items with user_id

  1. Changes
    - Insert sample products into inventory_items table with user_id
    - Products will be visible to all authenticated users due to RLS policy
*/

INSERT INTO inventory_items (
  sku, 
  name, 
  description, 
  quantity, 
  location, 
  category, 
  minimum_stock, 
  unit,
  user_id
)
SELECT
  i.sku,
  i.name,
  i.description,
  i.quantity,
  i.location,
  i.category,
  i.minimum_stock,
  i.unit,
  (SELECT id FROM auth.users LIMIT 1) -- Get the first user's ID
FROM (
  VALUES
    ('LAPTOP-001', 'Business Laptop', '15" Professional Laptop with 16GB RAM', 25, 'Warehouse A', 'Electronics', 5, 'pcs'),
    ('PHONE-001', 'Smartphone X', 'Latest model smartphone', 50, 'Warehouse A', 'Electronics', 10, 'pcs'),
    ('PAPER-001', 'A4 Paper', 'Standard white A4 printing paper', 1000, 'Warehouse B', 'Office Supplies', 200, 'pcs'),
    ('PEN-001', 'Blue Pens', 'Premium ballpoint pens', 500, 'Warehouse B', 'Office Supplies', 100, 'pcs'),
    ('TOOL-001', 'Power Drill', 'Cordless power drill 18V', 15, 'Warehouse C', 'Tools', 3, 'pcs'),
    ('TOOL-002', 'Hammer Set', 'Professional grade hammer set', 30, 'Warehouse C', 'Tools', 5, 'pcs'),
    ('CAB-001', 'USB-C Cable', 'High-speed charging cable 2m', 200, 'Warehouse A', 'Electronics', 50, 'pcs'),
    ('DESK-001', 'Office Desk', 'Ergonomic office desk', 10, 'Warehouse D', 'Furniture', 2, 'pcs'),
    ('CHAIR-001', 'Office Chair', 'Adjustable office chair', 20, 'Warehouse D', 'Furniture', 4, 'pcs'),
    ('INK-001', 'Printer Ink', 'Black printer ink cartridge', 75, 'Warehouse B', 'Office Supplies', 15, 'pcs')
  ) AS i(sku, name, description, quantity, location, category, minimum_stock, unit)
ON CONFLICT (sku) DO NOTHING;