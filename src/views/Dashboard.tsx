import React, { useState } from 'react';
import { Menu, ChevronDown, User, LogOut, CreditCard, Sparkles, Key, Coins, Plus } from 'lucide-react';
import { Sidebar } from '../components/Layout/Sidebar';
import { Mentor } from '../components/Dashboard/Mentor';
import { ListingOptimizer } from '../components/Dashboard/ListingOptimizer';
import { ProfitAnalytics } from '../components/Dashboard/ProfitAnalytics';
import { ProductFinder } from '../components/Dashboard/ProductFinder';
import { Settings } from '../components/Dashboard/Settings';
import { AccountDashboard } from '../components/Dashboard/AccountDashboard';
import { DashboardModule } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../services/languageService';
import { ChangePasswordModal } from '../components/Auth/ChangePasswordModal';
import { BuyCreditsModal } from '../components/Dashboard/BuyCreditsModal';
import { ChangePlanModal } from '../components/Dashboard/ChangePlanModal';
import { CreditGuard } from '../components/Dashboard/CreditGuard';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentModule, setCurrentModule] = useState<DashboardModule>(DashboardModule.PRODUCT_FINDER);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const renderModule = () => {
    switch (currentModule) {
      case DashboardModule.MENTOR:
        return (
          <CreditGuard onBuyCredits={() => setIsBuyCreditsOpen(true)}>
            <Mentor />
          </CreditGuard>
        );
      case DashboardModule.LISTING_OPTIMIZER:
        return (
          <CreditGuard onBuyCredits={() => setIsBuyCreditsOpen(true)}>
            <ListingOptimizer />
          </CreditGuard>
        );
      case DashboardModule.PRODUCT_FINDER:
        return (
          <CreditGuard onBuyCredits={() => setIsBuyCreditsOpen(true)}>
            <ProductFinder />
          </CreditGuard>
        );
      case DashboardModule.PROFIT_ANALYTICS:
        return (
          <div className="opacity-40 grayscale pointer-events-none select-none relative h-full overflow-hidden">
            <ProfitAnalytics />
          </div>
        );
      case DashboardModule.SETTINGS:
        return <Settings />;
      case DashboardModule.ADS_MANAGER:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl border border-gray-100 opacity-40 grayscale pointer-events-none select-none">
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
      case DashboardModule.ACCOUNT:
        return (
          <AccountDashboard
            onOpenBuyCredits={() => setIsBuyCreditsOpen(true)}
            onOpenChangePlan={() => setIsChangePlanOpen(true)}
            onOpenChangePassword={() => setIsChangePassOpen(true)}
          />
        );
      default:
        return (
          <div className="opacity-40 grayscale pointer-events-none select-none relative h-full overflow-hidden">
            <ProfitAnalytics />
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (currentModule) {
      case DashboardModule.MENTOR: return t('module.mentor');
      case DashboardModule.LISTING_OPTIMIZER: return t('module.listing_optimizer');
      case DashboardModule.PRODUCT_FINDER: return t('module.product_finder');
      case DashboardModule.PROFIT_ANALYTICS: return t('module.dashboard');
      case DashboardModule.ADS_MANAGER: return t('module.ads_manager');
      case DashboardModule.SETTINGS: return t('module.settings');
      case DashboardModule.ACCOUNT: return "Minha Conta";
      default: return "Dashboard";
    }
  };

  const handleCheckout = async (priceId: string, type: 'credits' | 'plan', planId?: number) => {
    setLoadingCheckout(true);
    try {
      const payload: any = { type };
      if (type === 'credits' && ['micro', 'business', 'bulk'].includes(priceId)) {
        payload.pack = priceId;
      } else {
        payload.priceId = priceId;
        if (planId) payload.planId = planId;
      }

      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Erro ao criar checkout:', data.error);
        alert('Erro ao iniciar checkout. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      alert('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoadingCheckout(false);
    }
  };

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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{getTitle()}</h1>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Credit Badge */}
            <div className="hidden md:flex items-center gap-2 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 mr-2">
              <Coins className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-brand-700">{user?.credits_balance || 0}</span>
              <span className="text-xs text-brand-500 font-medium">Créditos</span>
              <button
                onClick={() => setIsBuyCreditsOpen(true)}
                className="ml-2 w-5 h-5 flex items-center justify-center bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors"
                title={t('profile.buy_credits')}
              >
                <Plus size={12} />
              </button>
            </div>

            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors text-right group"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-600 transition-colors">
                  {user?.email || 'Usuário'}
                </span>
                <span className="text-xs text-brand-600 font-medium">
                  {user?.role === 'ADMIN' ? t('profile.admin_label') :
                    user?.plan_name ? t(`plans.${user.plan_name.toLowerCase()}`) : t('plans.free')}
                </span>
              </div>
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold border border-brand-200 uppercase group-hover:bg-brand-200 transition-all overflow-hidden">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.email || 'U').substring(0, 2)
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">{t('profile.welcome')}</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => { setCurrentModule(DashboardModule.ACCOUNT); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-600 flex items-center gap-3 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Minha Conta
                  </button>

                  <button
                    onClick={() => { setCurrentModule(DashboardModule.ACCOUNT); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-600 flex items-center gap-3 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    {t('profile.change_password')}
                  </button>

                  <button
                    onClick={() => { setCurrentModule(DashboardModule.ACCOUNT); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-600 flex items-center gap-3 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    {t('profile.buy_credits')}
                  </button>

                  <button
                    onClick={() => { setCurrentModule(DashboardModule.ACCOUNT); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-600 flex items-center gap-3 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('profile.change_plan')}
                  </button>

                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('module.logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Module Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {renderModule()}
        </div>
      </main>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />

      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
        onBuy={(priceId) => handleCheckout(priceId, 'credits')}
        loading={loadingCheckout}
      />

      <ChangePlanModal
        isOpen={isChangePlanOpen}
        onClose={() => setIsChangePlanOpen(false)}
        onSelectPlan={(priceId, planId) => handleCheckout(priceId, 'plan', planId)}
        // TODO: Pass current plan from user context if available
        currentPlan="free"
        loading={loadingCheckout}
      />
    </div>
  );
};