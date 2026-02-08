import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  Search,
  Sparkles,
  Megaphone,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { DashboardModule } from '../../types';
import { useLanguage } from '../../services/languageService';

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
  const { t, language, setLanguage } = useLanguage();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: DashboardModule.PROFIT_ANALYTICS, label: t('module.dashboard'), icon: LayoutDashboard },
    { id: DashboardModule.MENTOR, label: t('module.mentor'), icon: Bot },
    { id: DashboardModule.PRODUCT_FINDER, label: t('module.product_finder'), icon: Search },
    { id: DashboardModule.LISTING_OPTIMIZER, label: t('module.listing_optimizer'), icon: Sparkles },
    { id: DashboardModule.ADS_MANAGER, label: t('module.ads_manager'), icon: Megaphone },
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
        ${isCollapsed ? 'w-20' : 'w-64'} bg-dark-900 text-gray-300 flex flex-col
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 text-[0px]'}
      `}>
        {/* Logo & Toggle */}
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 min-w-[32px] bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            {!isCollapsed && <span className="text-white font-bold tracking-tight whitespace-nowrap">AI Suite</span>}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded hover:bg-dark-800 text-gray-400 hover:text-white transition-colors ${isCollapsed ? 'absolute -right-3 top-6 bg-dark-800 border border-dark-700 rounded-full w-6 h-6 shadow-xl' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={18} />}
          </button>

          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 mt-4">
          {!isCollapsed && <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ferramentas</p>}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            const isDisabled = (item as any).disabled;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isDisabled) {
                    onModuleChange(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }
                }}
                disabled={isDisabled}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} gap-3 py-3 rounded-xl transition-all duration-200
                  ${isDisabled
                    ? 'opacity-50 cursor-not-allowed hover:bg-transparent text-gray-500'
                    : isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                      : 'hover:bg-dark-800 hover:text-white'
                  }
                `}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-dark-800 space-y-2">

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors text-sm`}
            >
              {isCollapsed ? (
                <span className="text-xl">
                  {language === 'pt' ? '🇧🇷' : language === 'es' ? '🇪🇸' : '🇺🇸'}
                </span>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span>
                      {language === 'pt' ? '🇧🇷 Português' : language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {isLanguageOpen && (
              <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-2 w-48' : 'left-0 w-full'} mb-2 bg-dark-800 rounded-lg shadow-xl border border-dark-700 overflow-hidden z-50`}>
                <button
                  onClick={() => { setLanguage('pt'); setIsLanguageOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">🇧🇷 Português</span>
                  {language === 'pt' && <Check size={14} className="text-brand-500" />}
                </button>
                <button
                  onClick={() => { setLanguage('es'); setIsLanguageOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">🇪🇸 Español</span>
                  {language === 'es' && <Check size={14} className="text-brand-500" />}
                </button>
                <button
                  onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">🇺🇸 English</span>
                  {language === 'en' && <Check size={14} className="text-brand-500" />}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onModuleChange(DashboardModule.SETTINGS)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} gap-3 py-2 rounded-lg hover:bg-dark-800 hover:text-white transition-colors`}
            title={isCollapsed ? t('module.settings') : ''}
          >
            <Settings className={`w-4 h-4 min-w-[16px] ${currentModule === DashboardModule.SETTINGS ? 'text-white' : 'text-gray-400'}`} />
            {!isCollapsed && <span className={`text-sm ${currentModule === DashboardModule.SETTINGS ? 'text-white' : 'text-gray-400'}`}>{t('module.settings')}</span>}
          </button>
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} gap-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-red-400/80 transition-colors`}
            title={isCollapsed ? t('module.logout') : ''}
          >
            <LogOut className="w-4 h-4 min-w-[16px]" />
            {!isCollapsed && <span className="text-sm">{t('module.logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};