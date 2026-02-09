import React, { useState, useEffect } from 'react';
import { CreditCard, History, TrendingUp, Filter, Calendar, Clock, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UsageEntry {
    id: string;
    type: 'usage' | 'grant';
    label: string;
    amount: number;
    created_at: string;
    metadata?: any;
}

interface BillingSectionProps {
    onOpenBuyCredits: () => void;
    onOpenChangePlan: () => void;
}

export const BillingSection: React.FC<BillingSectionProps> = ({
    onOpenBuyCredits,
    onOpenChangePlan
}) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<UsageEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, subRes] = await Promise.all([
                    fetch('/.netlify/functions/get-usage-history'),
                    fetch('/.netlify/functions/get-subscription-info')
                ]);

                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setHistory(data);
                }

                if (subRes.ok) {
                    const subData = await subRes.json();
                    setSubscriptionInfo(subData);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCancelSubscription = async () => {
        setIsCanceling(true);
        try {
            const res = await fetch('/.netlify/functions/cancel-subscription', {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                setSubscriptionInfo({ ...subscriptionInfo, cancel_at_period_end: true, current_period_end: data.current_period_end });
                setShowCancelModal(false);
                alert('Subscrição cancelada. Continuará ativa até ao fim do período atual.');
            } else {
                const error = await res.json();
                alert(`Erro: ${error.error}`);
            }
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            alert('Erro ao cancelar subscrição.');
        } finally {
            setIsCanceling(false);
        }
    };

    const getLabel = (entry: UsageEntry) => {
        if (entry.type === 'grant') return entry.label;

        const labels: Record<string, string> = {
            'SEARCH_PRODUCT': 'Busca de Produtos',
            'LISTING_CREATOR': 'Gerador de Listing',
            'IMAGE_GENERATION': 'Gerador de Imagens',
            'MENTOR_VIRTUAL': 'Mentor IA',
        };
        return labels[entry.label] || entry.label;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-2xl border border-gray-200 dark:border-dark-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-brand-500/10 rounded-xl">
                            <CreditCard className="w-6 h-6 text-brand-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-400">Plano Atual</p>
                            <h4 className="text-xl font-bold text-white capitalize">{user?.plan_name || 'Grátis'}</h4>
                            {subscriptionInfo?.cancel_at_period_end && (
                                <p className="text-xs text-orange-500 mt-1">Cancela em {new Date(subscriptionInfo.current_period_end * 1000).toLocaleDateString('pt-BR')}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onOpenChangePlan}
                            className="flex-1 py-2 text-sm font-bold text-brand-500 hover:bg-brand-500/5 rounded-lg transition-colors"
                        >
                            Alterar Plano
                        </button>
                        {user?.plan_name && user.plan_name !== 'Grátis' && !subscriptionInfo?.cancel_at_period_end && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="flex-1 py-2 text-sm font-bold text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-2xl border border-gray-200 dark:border-dark-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                            <History className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Saldo de Créditos</p>
                            <h4 className="text-xl font-bold text-white">{user?.credits_balance}</h4>
                        </div>
                    </div>
                    <button
                        onClick={onOpenBuyCredits}
                        className="w-full py-2 text-sm font-bold text-orange-500 hover:bg-orange-500/5 rounded-lg transition-colors"
                    >
                        Comprar Créditos
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-2xl border border-gray-200 dark:border-dark-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Consumido</p>
                            <h4 className="text-xl font-bold text-white">
                                {Math.abs(history.filter(h => h.type === 'usage').reduce((acc, curr) => acc + curr.amount, 0))} Cr.
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage History Table */}
            <div className="bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-dark-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-brand-500" />
                        <h3 className="text-lg font-bold text-white">Contabilidade de Créditos</h3>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-dark-800/50 text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Data & Hora</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4 text-right">Créditos</th>
                                <th className="px-6 py-4">Tipo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700/50">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-dark-800 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-dark-800 rounded"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-dark-800 rounded ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-dark-800 rounded"></div></td>
                                    </tr>
                                ))
                            ) : history.length > 0 ? (
                                history.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-brand-500/5 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                                                <Clock className="w-3 h-3 ml-2" />
                                                {new Date(entry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                                                {getLabel(entry)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold ${entry.amount > 0 ? 'text-green-500' : 'text-orange-500'}`}>
                                                {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${entry.type === 'grant'
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-orange-500/10 text-orange-500'
                                                }`}>
                                                {entry.type === 'grant' ? 'Crédito' : 'Consumo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                                        Nenhum registo encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-500/10 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Cancelar Subscrição</h3>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Tem a certeza que deseja cancelar a sua subscrição? O plano continuará ativo até ao fim do período atual, mas não será renovado.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-dark-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                disabled={isCanceling}
                                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isCanceling ? 'A cancelar...' : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
