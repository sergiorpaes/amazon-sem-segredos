import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/Layout/Sidebar';
import { Mentor } from '../components/Dashboard/Mentor';
import { ListingOptimizer } from '../components/Dashboard/ListingOptimizer';
import { ProfitAnalytics } from '../components/Dashboard/ProfitAnalytics';
import { ProductFinder } from '../components/Dashboard/ProductFinder';
import { Settings } from '../components/Dashboard/Settings';
import { DashboardModule } from '../types';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentModule, setCurrentModule] = useState<DashboardModule>(DashboardModule.PROFIT_ANALYTICS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderModule = () => {
    switch (currentModule) {
      case DashboardModule.MENTOR:
        return <Mentor />;
      case DashboardModule.LISTING_OPTIMIZER:
        return <ListingOptimizer />;
      case DashboardModule.PRODUCT_FINDER:
        return <ProductFinder />;
      case DashboardModule.PROFIT_ANALYTICS:
        return <ProfitAnalytics />;
      case DashboardModule.SETTINGS:
        return <Settings />;
      case DashboardModule.ADS_MANAGER:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl border border-gray-100">
            <div className="bg-brand-50 p-6 rounded-full mb-6">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ads Manager AI (Premium)</h2>
            <p className="text-gray-500 max-w-md">
              Este módulo utiliza Reinforcement Learning para otimizar seus lances e palavras-chave automaticamente. Disponível no plano Premium.
            </p>
            <button className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
              Fazer Upgrade
            </button>
          </div>
        );
      default:
        return <ProfitAnalytics />;
    }
  };

  const getTitle = () => {
    switch (currentModule) {
      case DashboardModule.MENTOR: return "Mentor Virtual";
      case DashboardModule.LISTING_OPTIMIZER: return "Otimizador de Listings";
      case DashboardModule.PRODUCT_FINDER: return "Buscador de Produtos";
      case DashboardModule.PROFIT_ANALYTICS: return "Visão Geral";
      case DashboardModule.ADS_MANAGER: return "Gerenciador de Ads";
      case DashboardModule.SETTINGS: return "Configurações";
      default: return "Dashboard";
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentModule={currentModule}
        onModuleChange={setCurrentModule}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{getTitle()}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700">Vendedor Demo</span>
              <span className="text-xs text-brand-600">Plano Pro</span>
            </div>
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold border border-brand-200">
              VD
            </div>
          </div>
        </header>

        {/* Module Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};