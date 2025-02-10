import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  location: string;
  category: string;
  minimum_stock: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

interface Filters {
  search: string;
  category: string;
  location: string;
  stock: 'all' | 'low' | 'out';
}

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [removeQuantity, setRemoveQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: 'all',
    location: 'all',
    stock: 'all'
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    sku: '',
    name: '',
    description: '',
    quantity: 1,
    location: '',
    category: '',
    minimum_stock: 1,
    unit: 'pcs'
  });

  const MAX_INTEGER = 2147483647;

  const validateQuantity = (value: number): string => {
    if (isNaN(value)) return 'Must be a valid number';
    if (value < 0) return 'Must be a positive number';
    if (value > MAX_INTEGER) return 'Value is too large';
    if (!Number.isInteger(value)) return 'Must be a whole number';
    return '';
  };

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      if (error) throw error;
      setCategories(data.map(c => c.name));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('name')
        .order('name');

      if (error) throw error;
      setLocations(data.map(l => l.name));
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.location !== 'all') {
        query = query.eq('location', filters.location);
      }

      if (filters.stock === 'low') {
        query = query.lt('quantity', supabase.raw('minimum_stock'));
      } else if (filters.stock === 'out') {
        query = query.eq('quantity', 0);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Parse and validate quantity and minimum_stock
      const quantity = Math.floor(Number(newItem.quantity));
      const minimum_stock = Math.floor(Number(newItem.minimum_stock));

      // Validate quantity
      const quantityError = validateQuantity(quantity);
      if (quantityError) {
        throw new Error(`Invalid quantity: ${quantityError}`);
      }

      // Validate minimum stock
      const minStockError = validateQuantity(minimum_stock);
      if (minStockError) {
        throw new Error(`Invalid minimum stock: ${minStockError}`);
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          sku: newItem.sku,
          name: newItem.name,
          description: newItem.description,
          quantity: quantity,
          location: newItem.location,
          category: newItem.category,
          minimum_stock: minimum_stock,
          unit: newItem.unit
        }])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewItem({
        sku: '',
        name: '',
        description: '',
        quantity: 1,
        location: '',
        category: '',
        minimum_stock: 1,
        unit: 'pcs'
      });
      toast.success('Product added successfully!');
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error(error.message === 'duplicate key value violates unique constraint "inventory_items_sku_key"'
        ? 'A product with this SKU already exists'
        : error.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStock = async () => {
    if (!selectedItem) return;

    try {
      setIsLoading(true);
      const currentQuantity = Math.floor(Number(selectedItem.quantity));
      const removeAmount = Math.floor(Number(removeQuantity));
      
      // Validate the remove amount
      const removeError = validateQuantity(removeAmount);
      if (removeError) {
        throw new Error(`Invalid quantity to remove: ${removeError}`);
      }

      const newQuantity = Math.max(0, currentQuantity - removeAmount);

      // Validate the new quantity
      const newQuantityError = validateQuantity(newQuantity);
      if (newQuantityError) {
        throw new Error(`Invalid resulting quantity: ${newQuantityError}`);
      }

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      const { data: updatedItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', selectedItem.id)
        .single();

      if (fetchError) throw fetchError;

      setItems(prev => prev.map(item => 
        item.id === selectedItem.id ? updatedItem : item
      ));

      toast.success('Stock updated successfully');
      setShowRemoveModal(false);
      setSelectedItem(null);
      setRemoveQuantity(1);
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error(error.message || 'Failed to update stock');
      fetchItems();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className="btn btn-secondary flex items-center gap-2 w-full sm:w-auto"
          >
            <Filter className="w-4 h-4" />
            <span className="whitespace-nowrap">Filters</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading inventory...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:-mx-6">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500">SKU</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden sm:table-cell">Location</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden md:table-cell">Category</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden lg:table-cell">Last Updated</th>
                    <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{item.sku}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-500 sm:hidden">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <span className={item.quantity <= item.minimum_stock ? 'text-red-600 font-medium' : ''}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 hidden sm:table-cell">{item.location}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 hidden md:table-cell">{item.category}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap hidden lg:table-cell">
                        {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowRemoveModal(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={newItem.sku}
                    onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={MAX_INTEGER}
                    value={newItem.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setNewItem(prev => ({
                        ...prev,
                        quantity: Math.min(Math.max(0, value), MAX_INTEGER)
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a whole number between 0 and {MAX_INTEGER.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    required
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Liters (l)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="m">Meters (m)</option>
                    <option value="cm">Centimeters (cm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    required
                    value={newItem.location}
                    onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={MAX_INTEGER}
                    value={newItem.minimum_stock}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setNewItem(prev => ({
                        ...prev,
                        minimum_stock: Math.min(Math.max(0, value), MAX_INTEGER)
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a whole number between 0 and {MAX_INTEGER.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary w-full sm:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span className="whitespace-nowrap">Adding...</span>
                    </>
                  ) : (
                    <span className="whitespace-nowrap">Add Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Stock Modal */}
      {showRemoveModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold">Remove Stock</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              How many units would you like to remove from <span className="font-medium">{selectedItem.name}</span>?
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity to Remove
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem.quantity}
                value={removeQuantity}
                onChange={(e) => setRemoveQuantity(Math.min(selectedItem.quantity, Math.max(1, parseInt(e.target.value) || 0)))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Current stock: {selectedItem.quantity} {selectedItem.unit}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setSelectedItem(null);
                  setRemoveQuantity(1);
                }}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveStock}
                disabled={isLoading}
                className="btn btn-primary bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="whitespace-nowrap">Removing...</span>
                  </>
                ) : (
                  <span className="whitespace-nowrap">Remove Stock</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Filter Products</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Level
                </label>
                <select
                  value={filters.stock}
                  onChange={(e) => setFilters(prev => ({ ...prev, stock: e.target.value as 'all' | 'low' | 'out' }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    category: 'all',
                    location: 'all',
                    stock: 'all'
                  });
                  setShowFilters(false);
                }}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setShowFilters(false);
                }}
                className="btn btn-primary w-full sm:w-auto"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;