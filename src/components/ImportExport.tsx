import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, FileCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const ImportExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const items = XLSX.utils.sheet_to_json(sheet);

        // Validate and format the data
        const formattedItems = items.map((item: any) => ({
          sku: item.sku?.toString(),
          name: item.name,
          description: item.description || '',
          quantity: parseInt(item.quantity) || 0,
          location: item.location || '',
          category: item.category || '',
          minimum_stock: parseInt(item.minimum_stock) || 0,
          unit: item.unit || 'pcs'
        }));

        // Insert into Supabase
        const { error } = await supabase
          .from('inventory_items')
          .insert(formattedItems);

        if (error) throw error;

        toast.success(`Successfully imported ${formattedItems.length} items`);
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };

      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import items');
    } finally {
      setIsImporting(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

      // Generate file name with date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `inventory_export_${date}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, fileName);
      toast.success('Export completed successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Import/Export</h1>
        <p className="text-gray-600">Manage your inventory data through imports and exports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Import Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg shrink-0">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-1">Import Inventory</h2>
              <p className="text-gray-600 text-sm mb-4">
                Upload an Excel file (.xlsx) to import inventory items
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`btn btn-primary inline-flex items-center gap-2 ${
                  isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="whitespace-nowrap">Importing...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="whitespace-nowrap">Select File</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Import Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>File must be in .xlsx format</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>Required columns: sku, name, quantity</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>Optional: description, location, category, minimum_stock, unit</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-50 rounded-lg shrink-0">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-1">Export Inventory</h2>
              <p className="text-gray-600 text-sm mb-4">
                Download your entire inventory as an Excel file
              </p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`btn btn-primary bg-green-600 hover:bg-green-700 inline-flex items-center gap-2 ${
                  isExporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="whitespace-nowrap">Exporting...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="whitespace-nowrap">Export to Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">Export Details</h3>
            <ul className="text-sm text-green-800 space-y-2">
              <li className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>Exports all inventory items</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>Includes all product details</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>File name includes current date</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExport;