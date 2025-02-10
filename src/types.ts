export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  location: string;
  category: string;
  lastUpdated: string;
  minimumStock: number;
  unit: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  name: string;
}