import React, { useState, useEffect } from 'react';
import { CreditCard, History, TrendingUp, Filter, Calendar, Clock } from 'lucide-react';
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

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/.netlify/functions/get-usage-history');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

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
                <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-brand-500/10 rounded-xl">
                            <CreditCard className="w-6 h-6 text-brand-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Plano Atual</p>
                            <h4 className="text-xl font-bold text-white capitalize">{user?.plan_name || 'Grátis'}</h4>
                        </div>
                    </div>
                    <button
                        onClick={onOpenChangePlan}
                        className="w-full py-2 text-sm font-bold text-brand-500 hover:bg-brand-500/5 rounded-lg transition-colors"
                    >
                        Alterar Plano
                    </button>
                </div>

                <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
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

                <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
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
            <div className="bg-dark-900 border border-dark-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-dark-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-brand-500" />
                        <h3 className="text-lg font-bold text-white">Contabilidade de Créditos</h3>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-dark-800/50 text-xs font-bold text-gray-500 uppercase tracking-widest">
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
        </div>
    );
};
