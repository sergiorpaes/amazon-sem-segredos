import React, { useState, useEffect } from 'react';
import { LandingPage } from './views/LandingPage';
import { Dashboard } from './views/Dashboard';
import { AppView } from './types';
import { LanguageProvider } from './services/languageService';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

import { AdminDashboard } from './views/Admin/Dashboard';
import { AdminUsers } from './views/Admin/Users';
import { ResetPasswordView } from './views/ResetPassword';

import { Shield, Hammer, Construction, ArrowLeft } from 'lucide-react';
import { useLanguage } from './services/languageService';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  // Check Maintenance Mode
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/.netlify/functions/get-system-status');
        if (res.ok) {
          const data = await res.json();
          setIsMaintenance(data.isMaintenance);
        }
      } catch (e) {
        console.error('Failed to check maintenance mode');
      } finally {
        setCheckingMaintenance(false);
      }
    };
    checkMaintenance();
  }, []);

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
    // Force re-check maintenance on logout
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/.netlify/functions/get-system-status');
        if (res.ok) {
          const data = await res.json();
          setIsMaintenance(data.isMaintenance);
        }
      } catch (e) { }
    };
    checkMaintenance();
  };

  // Maintenance Barrier
  if (isMaintenance && user?.role !== 'ADMIN' && currentView !== AppView.LANDING) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('maintenance.title')}</h1>
        <p className="text-gray-600 max-w-md mb-8">
          {t('maintenance.desc')}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('maintenance.back')}
          </button>
          {!user && ( // Changed from !userRole to !user
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Login Admin
            </button>
          )}
        </div>
      </div>
    );
  }

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
      <SettingsProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;