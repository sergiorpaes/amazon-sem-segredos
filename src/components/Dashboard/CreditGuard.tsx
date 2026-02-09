
import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../services/languageService';

interface CreditGuardProps {
    children: React.ReactNode;
    onBuyCredits: () => void;
}

export const CreditGuard: React.FC<CreditGuardProps> = ({ children, onBuyCredits }) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    // Check if user has credits
    // We assume credits_balance is available. If undefined (loading), maybe show loading or allow?
    // user.credits_balance should be number.
    const hasCredits = (user?.credits_balance || 0) > 0;

    if (hasCredits) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            {/* Background Pattern/Blur to simulate content behind? Optionally */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10" />

            <div className="relative z-20 max-w-md text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 mx-4">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {t('lock.title') || 'Funcionalidade Bloqueada'}
                </h3>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    Ops! Seus créditos acabaram. Recarregue seu saldo ou faça upgrade para continuar otimizando seus lucros.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={onBuyCredits}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
                    >
                        <Zap size={18} />
                        Recarregar Créditos
                    </button>
                    {/* Optionally add Upgrade Plan button if distinct */}
                </div>
            </div>
        </div>
    );
};
