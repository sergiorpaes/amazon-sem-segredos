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

import { Shield, Hammer } from 'lucide-react';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const { user, login } = useAuth();
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full"></div>
            <div className="relative p-6 bg-dark-800 rounded-3xl border border-dark-700 shadow-2xl">
              <div className="w-20 h-20 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Hammer className="w-10 h-10 text-brand-500 animate-bounce" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-4">Sistema em Manutenção</h1>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Estamos realizando melhorias na plataforma para oferecer uma experiência ainda melhor.
                Voltaremos em breve!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-900 rounded-full border border-dark-700">
                <Shield className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Acesso Restrito</span>
              </div>

              <button
                onClick={() => login(null)} // This clears the local user state
                className="mt-8 text-gray-500 hover:text-white text-xs underline transition-colors"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
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