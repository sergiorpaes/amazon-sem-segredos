
import React, { useState, useEffect } from 'react';
import {
    Users, DollarSign, Activity, Settings, Loader2,
    ArrowUpRight, ArrowDownRight, Zap, Shield,
    Globe, Server, AlertCircle, Save, ToggleLeft, ToggleRight,
    CreditCard, UserPlus, Brain, Bug, Cpu, Lock, Unlock, Mail
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

interface AdminStats {
    totalUsers: number;
    activeSubs: number;
    monthlyRevenue: number;
    churnRate: number;
    totalCreditUsage: number;
    growthData: Array<{
        date: string;
        signups: number;
        cancellations: number;
    }>;
    // Global Configs
    stripeMode: 'TEST' | 'LIVE';
    registrationEnabled: boolean;
    aiModel: string;
    debugMode: boolean;
    initialCredits: number;
}

interface Plan {
    id: number;
    name: string;
    monthly_price_eur: number;
    credit_limit: number;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    // Global Config States
    const [stripeMode, setStripeMode] = useState<'TEST' | 'LIVE'>('TEST');
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [aiModel, setAiModel] = useState('gemini-1.5-flash');
    const [debugMode, setDebugMode] = useState(false);
    const [initialCredits, setInitialCredits] = useState(5);

    const [savingConfig, setSavingConfig] = useState(false);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            // Fetch enriched stats
            const statsResponse = await fetch('/.netlify/functions/get-admin-stats');
            if (!statsResponse.ok) throw new Error('Failed to fetch stats');
            const statsData = await statsResponse.json();
            setStats(statsData);

            if (statsData.isMaintenanceMode !== undefined) setIsMaintenanceMode(statsData.isMaintenanceMode);
            if (statsData.stripeMode) setStripeMode(statsData.stripeMode);
            if (statsData.registrationEnabled !== undefined) setRegistrationEnabled(statsData.registrationEnabled);
            if (statsData.aiModel) setAiModel(statsData.aiModel);
            if (statsData.debugMode !== undefined) setDebugMode(statsData.debugMode);
            if (statsData.initialCredits !== undefined) setInitialCredits(statsData.initialCredits);

            // Fetch plans for config
            const plansResponse = await fetch('/.netlify/functions/get-plans');
            if (plansResponse.ok) {
                const plansData = await plansResponse.json();
                setPlans(plansData);
            }

            setError(null);
        } catch (err: any) {
            console.error('Error fetching admin data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateGlobalConfig = async (key: string, value: any) => {
        try {
            setSavingConfig(true);
            const res = await fetch('/.netlify/functions/update-admin-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    type: 'UPDATE_CONFIG',
                    payload: { key, value }
                })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.details || errorData.error || 'Falha ao atualizar');
            }

            // Optimistic update for UI if needed, or just refresh
            fetchAdminData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSavingConfig(false);
        }
    };

    const handleUpdatePlan = async (planId: number, price: number, credits: number) => {
        try {
            setSavingConfig(true);
            const res = await fetch('/.netlify/functions/update-admin-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    type: 'UPDATE_PLAN',
                    payload: { planId, monthly_price_eur: price, credit_limit: credits }
                })
            });
            if (!res.ok) throw new Error('Failed to update plan');
            fetchAdminData(); // Refresh
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSavingConfig(false);
        }
    };

    const toggleMaintenance = () => updateGlobalConfig('maintenance_mode', !isMaintenanceMode);

    if (loading && !stats) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-brand-600 mb-4" />
                <p className="text-gray-500 animate-pulse">Carregando painel de controle...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">Erro ao carregar dados</h3>
                    <p className="text-red-600 dark:text-red-500 mb-6">{error}</p>
                    <button
                        onClick={fetchAdminData}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    const kpis = [
        {
            label: 'Receita Mensal (MRR)',
            value: `€${stats?.monthlyRevenue?.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/20',
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'Taxa de Churn',
            value: `${stats?.churnRate}%`,
            icon: Activity,
            color: 'text-red-600',
            bg: 'bg-red-100 dark:bg-red-900/20',
            trend: '-2%',
            trendUp: false
        },
        {
            label: 'Usuários Totais',
            value: stats?.totalUsers?.toLocaleString(),
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            trend: '+45',
            trendUp: true
        },
        {
            label: 'Uso de Créditos',
            value: stats?.totalCreditUsage?.toLocaleString(),
            icon: Zap,
            color: 'text-brand-600',
            bg: 'bg-brand-100 dark:bg-brand-900/20',
            trend: 'Estável',
            trendUp: true
        },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => (
                    <div key={index} className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${kpi.bg} transition-transform group-hover:scale-110`}>
                                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                            </div>
                            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${kpi.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {kpi.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                {kpi.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{kpi.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Crescimento da Plataforma</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comparativo de novos cadastros e cancelamentos (30 dias)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                                <span className="text-xs text-gray-500">Novos Usuários</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <span className="text-xs text-gray-500">Cancelamentos</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full min-h-[350px]">
                        {stats?.growthData && stats.growthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.growthData}>
                                    <defs>
                                        <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCancels" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                                        tickFormatter={(str) => new Date(str).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="signups" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
                                    <Area type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCancels)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm italic">
                                Sem dados de crescimento disponíveis.
                            </div>
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-500" />
                        Saúde do Sistema
                    </h2>
                    <div className="space-y-6">
                        <div className="group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    Amazon API Connection
                                </span>
                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-bold">ATIVA</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[98%]"></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Latência média: 145ms</p>
                        </div>

                        <div className="group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Server className="w-4 h-4 text-purple-500" />
                                    Base de Dados (Neon)
                                </span>
                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-bold">OPERACIONAL</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[100%]"></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">SLA: 99.99%</p>
                        </div>

                        <div className="group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    Gerador de Listings
                                </span>
                                <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full font-bold">CARGA MÉDIA</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-yellow-500 h-full w-[65%]"></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Fila: 12 tarefas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Settings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Business Settings */}
                <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-brand-500" />
                        Configurações de Negócio
                    </h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700">
                            <div className="flex items-center gap-3">
                                <CreditCard className={`w-5 h-5 ${stripeMode === 'LIVE' ? 'text-green-500' : 'text-blue-500'}`} />
                                <div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Ambiente Stripe</p>
                                    <p className="text-[10px] text-gray-500">Define o processamento de pagamentos</p>
                                </div>
                            </div>
                            <div className="flex bg-gray-200 dark:bg-dark-800 p-1 rounded-lg">
                                <button
                                    onClick={() => updateGlobalConfig('stripe_mode', 'TEST')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${stripeMode === 'TEST' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    TEST
                                </button>
                                <button
                                    onClick={() => updateGlobalConfig('stripe_mode', 'LIVE')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${stripeMode === 'LIVE' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    LIVE
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700">
                            <div className="flex items-center gap-3">
                                <UserPlus className={`w-5 h-5 ${registrationEnabled ? 'text-green-500' : 'text-red-500'}`} />
                                <div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Novos Registros</p>
                                    <p className="text-[10px] text-gray-500">Permite a criação de novas contas</p>
                                </div>
                            </div>
                            <button
                                onClick={() => updateGlobalConfig('registration_enabled', !registrationEnabled)}
                                disabled={savingConfig}
                                className="transition-colors disabled:opacity-50"
                            >
                                {registrationEnabled ? (
                                    <ToggleRight className="w-8 h-8 text-green-500" />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Créditos Iniciais</p>
                                    <p className="text-[10px] text-gray-500">Saldo padrão para novos usuários</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    key={initialCredits}
                                    defaultValue={initialCredits}
                                    onBlur={(e) => updateGlobalConfig('initial_credits', e.target.value)}
                                    className="w-16 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-1 text-sm text-center focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Intelligence & Ecosystem Settings */}
                <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        Configurações de Ecossistema
                    </h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700">
                            <div className="flex items-center gap-3">
                                <Cpu className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Modelo de IA</p>
                                    <p className="text-[10px] text-gray-500">Define o motor para chat e listings</p>
                                </div>
                            </div>
                            <select
                                value={aiModel}
                                onChange={(e) => updateGlobalConfig('ai_model', e.target.value)}
                                className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                            >
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700">
                            <div className="flex items-center gap-3">
                                <Bug className={`w-5 h-5 ${debugMode ? 'text-yellow-500' : 'text-gray-400'}`} />
                                <div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Modo Debug</p>
                                    <p className="text-[10px] text-gray-500">Logs detalhados nas funções Netlify</p>
                                </div>
                            </div>
                            <button
                                onClick={() => updateGlobalConfig('debug_mode', !debugMode)}
                                disabled={savingConfig}
                                className="transition-colors disabled:opacity-50"
                            >
                                {debugMode ? (
                                    <ToggleRight className="w-8 h-8 text-yellow-500" />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-3">
                                <Shield className={`w-5 h-5 ${isMaintenanceMode ? 'text-red-500' : 'text-gray-400'}`} />
                                <div>
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase">Modo Manutenção</p>
                                    <p className="text-[10px] text-red-600/70">Bloqueia acesso público a todo o sistema</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleMaintenance}
                                disabled={savingConfig}
                                className="transition-colors disabled:opacity-50"
                            >
                                {isMaintenanceMode ? (
                                    <ToggleRight className="w-8 h-8 text-red-500" />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Config Section */}
            <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Configurações de Planos Pagos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie preços de checkout e limites de bônus mensal.</p>
                    </div>
                    {savingConfig && (
                        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Salvando alterações...
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.id} className="p-6 bg-gray-50 dark:bg-dark-900/50 rounded-2xl border border-gray-100 dark:border-dark-700 space-y-4 hover:border-brand-300 transition-colors group">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <div className="p-1.5 bg-white dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700 transition-transform group-hover:scale-110">
                                    <Zap className="w-3 h-3 text-brand-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Preço Mensal (€)</label>
                                    <input
                                        type="number"
                                        defaultValue={plan.monthly_price_eur / 100}
                                        onBlur={(e) => handleUpdatePlan(plan.id, Number(e.target.value) * 100, plan.credit_limit)}
                                        className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Limite Créditos / Mês</label>
                                    <input
                                        type="number"
                                        defaultValue={plan.credit_limit}
                                        onBlur={(e) => handleUpdatePlan(plan.id, plan.monthly_price_eur, Number(e.target.value))}
                                        className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

