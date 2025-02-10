import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  item_name: string;
  action: string;
  timestamp: string;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  minimum_stock: number;
  sku: string;
}

const StatCard = ({ icon: Icon, label, value, trend, trendValue }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      {trend && (
        <span className={`flex items-center text-sm ${
          trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trendValue}
        </span>
      )}
    </div>
    <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{value}</h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
  </div>
);

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalQuantity: 0
  });
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*');

      if (itemsError) throw itemsError;

      const totalItems = items.length;
      const lowStockItems = items.filter(item => item.quantity <= item.minimum_stock);
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      setStats({
        totalItems,
        lowStockItems: lowStockItems.length,
        totalQuantity
      });

      const lowStockData = items
        .filter(item => item.quantity <= item.minimum_stock)
        .sort((a, b) => (a.quantity / a.minimum_stock) - (b.quantity / b.minimum_stock))
        .slice(0, 3)
        .map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          minimum_stock: item.minimum_stock,
          sku: item.sku
        }));

      setLowStockItems(lowStockData);

      const recentUpdates = items
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3)
        .map(item => ({
          id: item.id,
          item_name: item.name,
          action: 'Stock Update',
          timestamp: item.updated_at
        }));

      setRecentActivity(recentUpdates);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard
          icon={Package}
          label="Total Items"
          value={stats.totalItems.toLocaleString()}
          trend="up"
          trendValue="12.5%"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={stats.lowStockItems.toLocaleString()}
          trend={stats.lowStockItems > 5 ? "up" : "down"}
          trendValue={`${((stats.lowStockItems / stats.totalItems) * 100).toFixed(1)}%`}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Quantity"
          value={stats.totalQuantity.toLocaleString()}
          trend="up"
          trendValue="8.2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-gray-900 dark:text-white">{activity.action}: {activity.item_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Stock levels updated</p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Low Stock Alerts</h2>
          <div className="space-y-4">
            {lowStockItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No low stock items</p>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      Only {item.quantity} units remaining (Min: {item.minimum_stock})
                    </p>
                  </div>
                  <button className="whitespace-nowrap px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">
                    Reorder
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;