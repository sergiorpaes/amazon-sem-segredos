import React, { useState } from 'react';
import { LandingPage } from './views/LandingPage';
import { Dashboard } from './views/Dashboard';
import { AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);

  // In a real app, this would check authentication status
  const handleLogin = () => {
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentView(AppView.LANDING);
  };

  return (
    <>
      {currentView === AppView.LANDING ? (
        <LandingPage onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;