import React from 'react';
import { X, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    productTitle: string;
    data: number[];
    currentSales: number;
    currentPrice: number;
    currency: string;
}

export const SalesDetailModal: React.FC<SalesDetailModalProps> = ({
    isOpen, onClose, productTitle, data, currentSales, currentPrice, currency
}) => {
    if (!isOpen) return null;

    // Generate chart data with labels involves creating fake dates for the simulation
    const chartData = data.map((val, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (data.length - index)); // Go back in days
        return {
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            sales: val
        };
    });

    const estimatedRevenue = currentSales * currentPrice;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 line-clamp-1">{productTitle}</h2>
                        <p className="text-sm text-gray-500 mt-1">Análise de Tendência de Vendas (Estimada)</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* content */}
                <div className="p-6 space-y-8">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-800">Vendas Estimadas (30d)</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{currentSales.toLocaleString()} <span className="text-xs font-normal text-gray-500">unid.</span></div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Receita Estimada (30d)</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(estimatedRevenue)}
                            </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-800">Preço Atual</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(currentPrice)}
                            </div>
                        </div>
                    </div>

                    {/* Main Chart */}
                    <div className="h-80 w-full bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Histórico de Vendas (Simulado)</h3>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <p className="text-xs text-gray-400 text-center italic">
                        * Os dados históricos são estimados com base na categoria e ranking atual do produto.
                    </p>

                </div>
            </div>
        </div>
    );
};
