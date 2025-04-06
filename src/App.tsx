import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import ImportExport from './components/ImportExport';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import Login from './components/Login';
import ProgressBar from './components/ProgressBar';
import { Toaster } from 'react-hot-toast';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './lib/supabase';

const MainContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { setIsLoading, setProgress } = useLoading();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentPage('dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const handleNavigate = (page: string) => {
    setIsLoading(true);
    setProgress(0);
    setIsSidebarOpen(false);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    setCurrentPage(page);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'inventory':
        return <Inventory />;
      case 'import-export':
        return <ImportExport />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="min-h-screen bg-background">
          <ProgressBar />
          <Sidebar 
            onNavigate={handleNavigate} 
            currentPage={currentPage} 
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <Header 
            onNavigate={handleNavigate} 
            onLogout={handleLogout}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <main className={`transition-all duration-300 ${
            isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-64'
          } pt-16`}>
            {renderPage()}
          </main>
        </div>
      )}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))'
          }
        }}
      />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <MainContent />
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;