import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Search,
  Sparkles,
  BarChart,
  Megaphone,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { DashboardModule } from '../../types';

interface SidebarProps {
  currentModule: DashboardModule;
  onModuleChange: (module: DashboardModule) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onModuleChange,
  onLogout,
  isOpen,
  onClose
}) => {
  const menuItems = [
    { id: DashboardModule.PROFIT_ANALYTICS, label: 'Dashboard', icon: LayoutDashboard },
    { id: DashboardModule.MENTOR, label: 'Mentor.AI', icon: Bot },
    { id: DashboardModule.PRODUCT_FINDER, label: 'Product Finder', icon: Search },
    { id: DashboardModule.LISTING_OPTIMIZER, label: 'Listing Optimizer', icon: Sparkles },
    { id: DashboardModule.ADS_MANAGER, label: 'Ads Manager', icon: Megaphone },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-dark-900 text-gray-300 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="text-white font-bold tracking-tight">AI Suite</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ferramentas</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onModuleChange(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                    : 'hover:bg-dark-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-dark-800 space-y-2">
          <button
            onClick={() => onModuleChange(DashboardModule.SETTINGS)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-dark-800 hover:text-white transition-colors"
          >
            <Settings className={`w-4 h-4 ${currentModule === DashboardModule.SETTINGS ? 'text-white' : 'text-gray-400'}`} />
            <span className={`text-sm ${currentModule === DashboardModule.SETTINGS ? 'text-white' : 'text-gray-400'}`}>Configurações</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-red-400/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};