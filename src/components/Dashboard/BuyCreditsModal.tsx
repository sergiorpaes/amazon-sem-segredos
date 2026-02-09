import React from 'react';
import { X, Check, CreditCard, Loader2 } from 'lucide-react';
import { useLanguage } from '../../services/languageService';

interface BuyCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuy: (priceId: string) => void;
    loading: boolean;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, onBuy, loading }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const creditPackages = [
        {
            id: 'micro',
            name: 'Micro Pack',
            credits: 20,
            price: '€ 9,00',
            description: 'Para experimentação rápida.',
            popular: false
        },
        {
            id: 'business',
            name: 'Business Pack',
            credits: 100,
            price: '€ 29,00',
            description: 'Melhor custo-benefício.',
            popular: true
        },
        {
            id: 'bulk',
            name: 'Bulk Pack',
            credits: 300,
            price: '€ 79,00',
            description: 'Para alto volume de uso.',
            popular: false
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 text-center border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">Comprar Créditos</h2>
                    <p className="text-gray-500 mt-2">Escolha o pacote ideal para sua necessidade.</p>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid md:grid-cols-3 gap-6">
                        {creditPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`relative rounded-2xl border-2 p-6 flex flex-col items-center text-center transition-all hover:scale-105 ${pkg.popular ? 'border-brand-500 bg-brand-50/30' : 'border-gray-100 bg-white hover:border-brand-200'
                                    }`}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-4 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        Mais Popular
                                    </div>
                                )}

                                <h3 className="font-bold text-gray-900 text-lg mb-2">{pkg.name}</h3>
                                <div className="text-4xl font-extrabold text-gray-900 mb-2">{pkg.credits}</div>
                                <div className="text-sm font-medium text-gray-500 mb-6">Créditos</div>

                                <div className="text-2xl font-bold text-brand-600 mb-2">{pkg.price}</div>
                                <p className="text-gray-400 text-sm mb-8">{pkg.description}</p>

                                <button
                                    onClick={() => onBuy(pkg.id)}
                                    disabled={loading}
                                    className={`w-full py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mt-auto ${pkg.popular
                                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Comprar Agora'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
