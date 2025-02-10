import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FileSpreadsheet, 
  BarChart3, 
  LogOut,
  X
} from 'lucide-react';
import { useLoading } from '../context/LoadingContext';

interface SidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onNavigate, 
  currentPage, 
  onLogout,
  isOpen,
  onClose
}) => {
  const { isLoading } = useLoading();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Package, label: 'Inventory', id: 'inventory' },
    { icon: FileSpreadsheet, label: 'Import/Export', id: 'import-export' },
    { icon: BarChart3, label: 'Reports', id: 'reports' }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen text-white p-4 z-40
        transition-transform duration-300 transform
        w-64 bg-gray-900 dark:bg-gray-950
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl font-bold">WareFlow</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 dark:hover:bg-gray-900 rounded-lg md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !isLoading && onNavigate(item.id)}
              disabled={isLoading}
              className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors
                ${currentPage === item.id
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-900'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={onLogout}
          className={`flex items-center gap-3 w-full p-3 rounded-lg text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-900 mt-auto absolute bottom-4 left-4 right-4
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;