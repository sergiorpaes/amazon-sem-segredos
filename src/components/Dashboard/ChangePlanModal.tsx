import React from 'react';
import { X, Check, Star, Loader2, Zap } from 'lucide-react';
import { useLanguage } from '../../services/languageService';

interface ChangePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPlan: (priceId: string, planId: number) => void;
    currentPlan?: string;
    loading: boolean;
}

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ isOpen, onClose, onSelectPlan, currentPlan = 'free', loading }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const plans = [
        {
            id: 'free',
            dbId: 1,
            priceId: '',
            name: 'Free',
            price: '€ 0',
            period: '/mês',
            features: ['30 créditos iniciais', 'Análise básica', 'Suporte por email'],
            current: currentPlan === 'free'
        },
        {
            id: 'starter',
            dbId: 2,
            priceId: 'price_starter_placeholder',
            name: 'Starter',
            price: '€ 19',
            period: '/mês',
            features: ['90 créditos/mês', 'Acesso a Mentor', 'Suporte por e-mail'],
            current: currentPlan === 'starter'
        },
        {
            id: 'pro',
            dbId: 3,
            priceId: 'price_pro_placeholder', // Replaced by resolution logic in backend
            name: 'Pro',
            price: '€ 49',
            period: '/mês',
            features: ['200 créditos/mês', 'Acesso a tudo do Starter', 'Análise de ROI'],
            current: currentPlan === 'pro',
            highlight: true
        },
        {
            id: 'premium',
            dbId: 4,
            priceId: 'price_premium_placeholder',
            name: 'Premium',
            price: '€ 99',
            period: '/mês',
            features: ['600 créditos/mês', 'Tudo ilimitado', 'Mentoria VIP'],
            current: currentPlan === 'premium'
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 text-center border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">Escolha seu Plano</h2>
                    <p className="text-gray-500 mt-2">Desbloqueie todo o potencial da ferramenta.</p>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl border-2 p-8 flex flex-col transition-all hover:scale-105 ${plan.highlight ? 'border-brand-500 shadow-xl' : 'border-gray-100 hover:border-brand-200'
                                    } ${plan.current ? 'bg-gray-50' : 'bg-white'}`}
                            >
                                {plan.highlight && !plan.current && (
                                    <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg uppercase tracking-wide">
                                        Recomendado
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className={`font-bold text-xl mb-2 ${plan.highlight ? 'text-brand-600' : 'text-gray-900'}`}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                        <span className="text-gray-500 font-medium">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                                            <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-brand-500' : 'text-green-500'}`} />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => plan.priceId && onSelectPlan(plan.priceId, (plan as any).dbId)}
                                    disabled={loading || plan.current || !plan.priceId}
                                    className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.current
                                        ? 'bg-gray-200 text-gray-500 cursor-default'
                                        : plan.highlight
                                            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30'
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {loading && !plan.current && plan.priceId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : plan.current ? (
                                        'Plano Atual'
                                    ) : (
                                        'Selecionar Plano'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
