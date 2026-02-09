import React, { useState } from 'react';
import { User, Shield, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileSection } from './ProfileSection';
import { BillingSection } from './BillingSection';

interface AccountDashboardProps {
    onOpenBuyCredits: () => void;
    onOpenChangePlan: () => void;
    onOpenChangePassword: () => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
    onOpenBuyCredits,
    onOpenChangePlan,
    onOpenChangePassword
}) => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'security'>('profile');

    const TABS = [
        { id: 'profile', label: 'Ver Perfil', icon: User },
        { id: 'billing', label: 'Estatísticas & Créditos', icon: CreditCard },
        { id: 'security', label: 'Segurança & Senha', icon: Shield },
    ] as const;

    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="max-w-5xl mx-auto w-full mb-10">
                <h1 className="text-4xl font-bold text-white mb-2">A Minha Conta</h1>
                <p className="text-gray-500">Gere as suas informações pessoais, créditos e segurança.</p>
            </div>

            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300
                                    ${activeTab === tab.id
                                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                                        : 'bg-dark-900/50 text-gray-400 hover:bg-dark-900 hover:text-white border border-transparent hover:border-dark-700'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5" />
                                    <span className="font-bold">{tab.label}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
                            </button>
                        );
                    })}

                    <hr className="my-6 border-dark-700/50" />

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Sair da Conta
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 bg-dark-900/30 rounded-3xl border border-dark-700/50 p-8 backdrop-blur-sm shadow-2xl overflow-hidden">
                    {activeTab === 'profile' && <ProfileSection />}
                    {activeTab === 'billing' && (
                        <BillingSection
                            onOpenBuyCredits={onOpenBuyCredits}
                            onOpenChangePlan={onOpenChangePlan}
                        />
                    )}
                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="max-w-md">
                                <h3 className="text-xl font-bold text-white mb-6">Alterar Palavra-passe</h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400 mb-4">
                                        Para sua segurança, clique no botão abaixo para abrir o gestor de palavras-passe.
                                    </p>
                                    <button
                                        onClick={onOpenChangePassword}
                                        className="bg-brand-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-brand-600 transition-all"
                                    >
                                        Mudar Senha agora
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
