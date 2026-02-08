import React, { useState, useEffect } from 'react';
import { LandingPage } from './views/LandingPage';
import { Dashboard } from './views/Dashboard';
import { AppView } from './types';
import { LanguageProvider } from './services/languageService';

import { AuthProvider, useAuth } from './contexts/AuthContext';

import { AdminDashboard } from './views/Admin/Dashboard';
import { AdminUsers } from './views/Admin/Users';
import { ResetPasswordView } from './views/ResetPassword';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const { user, login } = useAuth();

  // Basic Routing Effect
  useEffect(() => {
    if (window.location.pathname === '/reset-password') {
      setCurrentView(AppView.RESET_PASSWORD);
      return;
    }

    if (user) {
      setCurrentView(AppView.DASHBOARD);
    } else {
      setCurrentView(AppView.LANDING);
    }
  }, [user]);

  const handleLogin = (userData: any) => {
    login(userData);
  };

  const handleLogout = () => {
    setCurrentView(AppView.LANDING);
  };

  return (
    <>
      {currentView === AppView.LANDING && (
        <LandingPage onLogin={() => { }} />
      )}

      {currentView === AppView.DASHBOARD && (
        <Dashboard onLogout={handleLogout} />
      )}

      {currentView === AppView.RESET_PASSWORD && (
        <ResetPasswordView />
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