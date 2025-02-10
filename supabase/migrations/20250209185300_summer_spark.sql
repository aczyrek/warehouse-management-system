/*
  # Add sample inventory products

  1. Changes
    - Insert sample products into inventory_items table
    
  2. Sample Data
    - Electronics category products
    - Office supplies
    - Tools and equipment
*/

INSERT INTO inventory_items (sku, name, description, quantity, location, category, minimum_stock, unit)
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
  ('INK-001', 'Printer Ink', 'Black printer ink cartridge', 75, 'Warehouse B', 'Office Supplies', 15, 'pcs');