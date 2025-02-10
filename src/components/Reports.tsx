import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Package, AlertTriangle, Download, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface CategoryStats {
  name: string;
  count: number;
  percentage: number;
}

const Reports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    categories: [] as CategoryStats[]
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('*');

      if (error) throw error;

      const totalItems = items.length;
      const lowStockItems = items.filter(item => item.quantity <= item.minimum_stock).length;
      const totalValue = items.reduce((acc, item) => acc + (item.quantity || 0), 0);

      // Calculate category statistics
      const categoryCount = items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categories = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalItems) * 100
      })).sort((a, b) => b.count - a.count);

      setStats({
        totalItems,
        lowStockItems,
        totalValue,
        categories
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (type: string) => {
    try {
      setIsLoading(true);
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let reportData;
      let fileName;

      switch (type) {
        case 'inventory':
          reportData = items.map(item => ({
            SKU: item.sku,
            Name: item.name,
            Quantity: item.quantity,
            Location: item.location,
            Category: item.category,
            'Minimum Stock': item.minimum_stock,
            Unit: item.unit
          }));
          fileName = 'inventory_summary';
          break;

        case 'low-stock':
          reportData = items
            .filter(item => item.quantity <= item.minimum_stock)
            .map(item => ({
              SKU: item.sku,
              Name: item.name,
              'Current Quantity': item.quantity,
              'Minimum Stock': item.minimum_stock,
              Location: item.location,
              Category: item.category
            }));
          fileName = 'low_stock_report';
          break;

        case 'activity':
          reportData = items
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .map(item => ({
              SKU: item.sku,
              Name: item.name,
              'Last Updated': new Date(item.updated_at).toLocaleString(),
              'Current Quantity': item.quantity,
              Location: item.location
            }));
          fileName = 'activity_log';
          break;

        default:
          throw new Error('Invalid report type');
      }

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      // Generate file name with date
      const date = new Date().toISOString().split('T')[0];
      fileName = `${fileName}_${date}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, fileName);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize recent activities to prevent regeneration
  const recentActivities = useMemo(() => {
    return [
      {
        type: 'update',
        message: 'Stock levels adjusted',
        time: '2h ago',
        icon: Package
      },
      {
        type: 'alert',
        message: 'Low stock warning',
        time: '3h ago',
        icon: AlertTriangle
      },
      {
        type: 'import',
        message: 'New inventory imported',
        time: '5h ago',
        icon: Download
      }
    ];
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">View insights and analytics about your inventory</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{stats.totalItems}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Products</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{stats.lowStockItems}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Low Stock Items</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{stats.totalValue}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Quantity</p>
        </div>
      </div>

      {/* Category Distribution and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Category Distribution
          </h2>
          <div className="space-y-4">
            {stats.categories.map((category, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 md:w-32 font-medium text-gray-700 dark:text-gray-300 truncate">
                  {category.name}
                </div>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="w-16 text-sm text-gray-500 dark:text-gray-400 text-right">
                  {category.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b dark:border-gray-700 last:border-0">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
                  <activity.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-gray-900 dark:text-white">{activity.message}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{activity.type}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Download Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { type: 'inventory', label: 'Inventory Summary' },
            { type: 'low-stock', label: 'Low Stock Report' },
            { type: 'activity', label: 'Activity Log' }
          ].map(report => (
            <button
              key={report.type}
              onClick={() => handleDownload(report.type)}
              disabled={isLoading}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{report.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;