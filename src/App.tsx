import React, { useState, useEffect } from 'react';
import { LandingPage } from './views/LandingPage';
import { Dashboard } from './views/Dashboard';
import { AppView } from './types';
import { LanguageProvider } from './services/languageService';

import { AuthProvider, useAuth } from './contexts/AuthContext';

import { AdminDashboard } from './views/Admin/Dashboard';
import { AdminUsers } from './views/Admin/Users';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const { user, login } = useAuth();

  // Basic Routing Effect
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        setCurrentView(AppView.ADMIN_DASHBOARD);
      } else {
        setCurrentView(AppView.DASHBOARD);
      }
    } else {
      setCurrentView(AppView.LANDING);
    }
  }, [user]);

  const handleLogin = (userData: any) => {
    login(userData);
  };

  const handleLogout = () => {
    setCurrentView(AppView.LANDING);
    // Trigger logout in context/API
  };

  return (
    <>
      {currentView === AppView.LANDING && (
        <LandingPage onLogin={() => handleLogin({ id: 1, email: 'admin@example.com', role: 'ADMIN', credits: 999 })} />
      )}

      {currentView === AppView.DASHBOARD && (
        <Dashboard onLogout={handleLogout} />
      )}

      {currentView === AppView.ADMIN_DASHBOARD && (
        <div className="flex">
          {/* Simple Admin Sidebar Placeholder */}
          <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
            <div className="text-xl font-bold mb-8">Admin Panel</div>
            <div className="space-y-2">
              <button onClick={() => setCurrentView(AppView.ADMIN_DASHBOARD)} className="block w-full text-left p-2 hover:bg-gray-800 rounded">Dashboard</button>
              <button onClick={() => setCurrentView(AppView.ADMIN_USERS)} className="block w-full text-left p-2 hover:bg-gray-800 rounded">Users</button>
              <button onClick={handleLogout} className="block w-full text-left p-2 hover:bg-gray-800 rounded text-red-400 mt-8">Logout</button>
            </div>
          </div>
          <div className="flex-1">
            <AdminDashboard />
          </div>
        </div>
      )}

      {currentView === AppView.ADMIN_USERS && (
        <div className="flex">
          <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
            <div className="text-xl font-bold mb-8">Admin Panel</div>
            <div className="space-y-2">
              <button onClick={() => setCurrentView(AppView.ADMIN_DASHBOARD)} className="block w-full text-left p-2 hover:bg-gray-800 rounded">Dashboard</button>
              <button onClick={() => setCurrentView(AppView.ADMIN_USERS)} className="block w-full text-left p-2 hover:bg-gray-800 rounded bg-gray-800">Users</button>
              <button onClick={handleLogout} className="block w-full text-left p-2 hover:bg-gray-800 rounded text-red-400 mt-8">Logout</button>
            </div>
          </div>
          <div className="flex-1">
            <AdminUsers />
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;