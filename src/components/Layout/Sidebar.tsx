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
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ShieldCheck, Users } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

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
  const { user } = useAuth();
  const { features } = useSettings();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: DashboardModule.PRODUCT_FINDER, label: t('module.product_finder'), icon: Search, disabled: !features.PRODUCT_FINDER },
    { id: DashboardModule.PROFIT_CALCULATOR, label: t('module.profit_calculator'), icon: LayoutDashboard, disabled: !features.PROFIT_CALCULATOR },
    { id: DashboardModule.LISTING_OPTIMIZER, label: t('module.listing_optimizer'), icon: Sparkles, disabled: !features.LISTING_OPTIMIZER },
    { id: DashboardModule.MENTOR, label: t('module.mentor'), icon: Bot, disabled: !features.MENTOR },
    { id: DashboardModule.SUPPLIER_FINDER, label: t('module.supplier_finder'), icon: Users, disabled: false },
    { id: DashboardModule.ADS_MANAGER, label: t('module.ads_manager'), icon: Megaphone, disabled: !features.ADS_MANAGER },
  ];

  if (user?.role === 'ADMIN') {
    menuItems.push({ id: DashboardModule.SETTINGS, label: t('module.settings'), icon: Settings, disabled: false });
  }

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
        ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-dark-900 text-gray-700 dark:text-gray-300 flex flex-col border-r border-gray-200 dark:border-dark-700
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 text-[0px]'}
      `}>
        {/* Logo & Toggle */}
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <img src="/logo.png" alt="AI Suite Logo" className="w-8 h-8 min-w-[32px] rounded-lg object-cover" />
            {!isCollapsed && <span className="text-gray-900 dark:text-white font-bold tracking-tight whitespace-nowrap">Amazon Sem Segredos IA Suite</span>}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-dark-800 text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${isCollapsed ? 'absolute -right-3 top-6 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-full w-6 h-6 shadow-xl' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={18} />}
          </button>

          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 mt-4">
          {!isCollapsed && <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('sidebar.tools')}</p>}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            const isDisabled = (item as any).disabled;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onModuleChange(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} gap-3 py-3 rounded-xl transition-all duration-200
                  ${isDisabled
                    ? 'opacity-50 hover:bg-transparent text-gray-500'
                    : isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
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
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors text-sm`}
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
              <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-2 w-48' : 'left-0 w-full'} mb-2 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-700 overflow-hidden z-50`}>
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

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => onModuleChange(DashboardModule.SETTINGS)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors`}
              title={isCollapsed ? t('module.settings') : ''}
            >
              <Settings className={`w-4 h-4 min-w-[16px] ${currentModule === DashboardModule.SETTINGS ? 'text-white' : 'text-gray-400'}`} />
              {!isCollapsed && <span className={`text-sm ${currentModule === DashboardModule.SETTINGS ? 'text-white' : 'text-gray-400'}`}>{t('module.settings')}</span>}
            </button>
          )}
          <div className={`${isCollapsed ? 'flex justify-center' : 'px-4'}`}>
            <ThemeToggle />
          </div>
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