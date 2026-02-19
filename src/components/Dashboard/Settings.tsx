import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, ShieldCheck, Lock, Globe, ChevronDown, ChevronUp, Users, BarChart, ToggleLeft, Globe2 } from 'lucide-react';
import { connectToAmazon, saveCredentials as saveToStorage, loadCredentials, AmazonCredentials, Region, SUPPORTED_MARKETPLACES } from '../../services/amazonAuthService';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings, AppFeatures } from '../../contexts/SettingsContext';
import { AdminDashboard } from '../../views/Admin/Dashboard';
import { AdminUsers } from '../../views/Admin/Users';
import { Suppliers as AdminSuppliers } from '../../views/Admin/Suppliers';

type SettingsTab = 'AMAZON_API' | 'ADMIN_STATS' | 'ADMIN_USERS' | 'ADMIN_SUPPLIERS' | 'FEATURES' | 'MARKETPLACES';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const { features, toggleFeature, enabledMarketplaces, toggleMarketplace } = useSettings();
    const [activeTab, setActiveTab] = useState<SettingsTab>('AMAZON_API');
    const [activeRegion, setActiveRegion] = useState<Region>('EU');

    const [credentials, setCredentials] = useState<AmazonCredentials>({
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        grantType: 'refresh_token',
        apiUrl: 'https://api.amazon.com/auth/o2/token'
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // Security State
    const [isServerSecured, setIsServerSecured] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [tempAccessToken, setTempAccessToken] = useState<string | null>(null);

    // Load credentials or check server on region switch
    useEffect(() => {
        if (activeTab === 'AMAZON_API') {
            checkConnection();
        }
    }, [activeRegion, activeTab]);

    const checkConnection = async () => {
        setMessage('');
        setTempAccessToken(null);
        setStatus('loading');
        setIsServerSecured(false);

        try {
            const data = await connectToAmazon({
                clientId: '', clientSecret: '', refreshToken: '',
                region: activeRegion
            });

            if (data.access_token) {
                setStatus('success');
                setIsServerSecured(true);
                setMessage(`Conexão Segura Estabelecida (${activeRegion}) via Servidor.`);
                setCredentials({
                    clientId: '', clientSecret: '', refreshToken: '',
                    grantType: 'refresh_token', apiUrl: 'https://api.amazon.com/auth/o2/token'
                });
            }
        } catch (err) {
            console.log("Server auth failed, checking local storage...");
            const saved = loadCredentials(activeRegion);
            if (saved) {
                setCredentials({
                    clientId: saved.clientId || '',
                    clientSecret: saved.clientSecret || '',
                    refreshToken: saved.refreshToken || '',
                    grantType: saved.grantType || 'refresh_token',
                    apiUrl: saved.apiUrl || 'https://api.amazon.com/auth/o2/token'
                });
                setStatus('idle');
                setMessage('Configuração de servidor não detectada. Usando credenciais locais.');
                setShowAdvanced(true);
            } else {
                setStatus('idle');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleManualSave = async () => {
        setStatus('loading');
        try {
            if (!credentials.clientId && !credentials.clientSecret && !credentials.refreshToken) {
                await checkConnection();
                return;
            }

            await connectToAmazon({ ...credentials, region: activeRegion });
            saveToStorage(credentials, activeRegion);
            setStatus('success');
            setMessage('Credenciais locais salvas e verificadas com sucesso.');
            setIsServerSecured(false);
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(err.message || 'Erro ao conectar via manual.');
        }
    };

    const regions: { id: Region; label: string; flag: string }[] = [
        { id: 'NA', label: 'América do Norte (US, CA, MX)', flag: '🌎' },
        { id: 'EU', label: 'Europa (ES, UK, DE...)', flag: '🇪🇺' },
        { id: 'FE', label: 'Extremo Oriente (JP, SG)', flag: '🌏' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-100 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie sua conta e as APIs de conexão.</p>
                    </div>
                </div>

                {user?.role === 'ADMIN' && (
                    <div className="flex bg-gray-100 dark:bg-dark-900 p-1 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm">
                        <button
                            onClick={() => setActiveTab('AMAZON_API')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'AMAZON_API'
                                ? 'bg-white dark:bg-dark-800 text-brand-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            <Globe size={18} />
                            API Amazon
                        </button>
                        <button
                            onClick={() => setActiveTab('ADMIN_STATS')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'ADMIN_STATS'
                                ? 'bg-white dark:bg-dark-800 text-brand-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            <BarChart size={18} />
                            Painel Admin
                        </button>
                        <button
                            onClick={() => setActiveTab('ADMIN_USERS')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'ADMIN_USERS'
                                ? 'bg-white dark:bg-dark-800 text-brand-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            <Users size={18} />
                            Usuários
                        </button>
                        <button
                            onClick={() => setActiveTab('ADMIN_SUPPLIERS')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'ADMIN_SUPPLIERS'
                                ? 'bg-white dark:bg-dark-800 text-brand-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            <Users size={18} />
                            Fornecedores
                        </button>
                        <button
                            onClick={() => setActiveTab('FEATURES')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'FEATURES'
                                ? 'bg-white dark:bg-dark-800 text-brand-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            <ToggleLeft size={18} />
                            Funcionalidades
                        </button>
                        <button
                            onClick={() => setActiveTab('MARKETPLACES')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'MARKETPLACES'
                                ? 'bg-white dark:bg-dark-800 text-brand-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            <Globe2 size={18} />
                            Marketplaces
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'AMAZON_API' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex space-x-2 border-b border-gray-200 mb-6">
                        {regions.map((region) => (
                            <button
                                key={region.id}
                                onClick={() => setActiveRegion(region.id)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeRegion === region.id
                                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border-b-2 border-brand-600'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-900'
                                    }`}
                            >
                                <span className="mr-2">{region.flag}</span>
                                {region.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm p-8">
                        <div className={`rounded-xl p-6 border mb-8 flex items-center justify-between ${isServerSecured
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-dark-700'
                            }`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${isServerSecured ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {isServerSecured ? <Lock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${isServerSecured ? 'text-green-800 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {isServerSecured ? 'Ambiente Seguro Ativo' : 'Configuração de Servidor Ausente'}
                                    </h3>
                                    <p className={`text-sm ${isServerSecured ? 'text-green-700 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {isServerSecured
                                            ? 'Suas credenciais estão protegidas no servidor. O navegador não possui acesso aos segredos.'
                                            : 'Defina as variáveis de ambiente no servidor para máxima segurança.'}
                                    </p>
                                </div>
                            </div>
                            {isServerSecured && (
                                <div className="px-4 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full uppercase tracking-wide">
                                    Protegido
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                            >
                                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                Configuração Manual / Override (Avançado)
                            </button>

                            {showAdvanced && (
                                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <p className="text-xs text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-100">
                                        ⚠️ <strong>Atenção:</strong> Inserir credenciais aqui salvará as chaves no armazenamento local do navegador.
                                        Use apenas para testes ou desenvolvimento local.
                                    </p>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label Placeholder</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                                        <input
                                            type="password"
                                            name="clientSecret"
                                            value={credentials.clientSecret}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Refresh Token</label>
                                        <input
                                            type="password"
                                            name="refreshToken"
                                            value={credentials.refreshToken}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handleManualSave}
                                        className="flex items-center gap-2 bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        Salvar Localmente (Não Recomendado)
                                    </button>
                                </div>
                            )}
                        </div>

                        {message && !isServerSecured && (
                            <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'ADMIN_STATS' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdminDashboard />
                </div>
            )}

            {activeTab === 'ADMIN_USERS' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdminUsers />
                </div>
            )}

            {activeTab === 'ADMIN_SUPPLIERS' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdminSuppliers />
                </div>
            )}

            {activeTab === 'FEATURES' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm p-8">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Funcionalidades do Sistema</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Ative ou desative módulos globais. Módulos desativados aparecerão como indisponíveis no menu.</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'PRODUCT_FINDER', label: 'Buscador de Produtos', desc: 'Pesquisa avançada de produtos na Amazon' },
                                { id: 'PROFIT_CALCULATOR', label: 'Calculadora de Lucro Real', desc: 'Cálculo detalhado de margens e ROI' },
                                { id: 'LISTING_OPTIMIZER', label: 'Criador de Listing', desc: 'Otimização de títulos e descrições com IA' },
                                { id: 'MENTOR', label: 'Mentor Virtual', desc: 'Assistente AI para estratégias de venda' },
                                { id: 'ADS_MANAGER', label: 'Gerenciador de Ads', desc: 'Gestão de campanhas publicitárias (Premium)' },
                            ].map((feature) => (
                                <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{feature.label}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={features[feature.id as keyof AppFeatures]}
                                            onChange={() => toggleFeature(feature.id as keyof AppFeatures)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'MARKETPLACES' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm p-8">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Gerenciar Marketplaces</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Selecione quais países estarão disponíveis no Buscador de Produtos.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SUPPORTED_MARKETPLACES.map((marketplace) => (
                                <div key={marketplace.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{marketplace.flag}</span>
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">{marketplace.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{marketplace.region} - {marketplace.code}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={enabledMarketplaces.includes(marketplace.id)}
                                            onChange={() => toggleMarketplace(marketplace.id)}
                                            disabled={enabledMarketplaces.length === 1 && enabledMarketplaces.includes(marketplace.id)}
                                        />
                                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${enabledMarketplaces.length === 1 && enabledMarketplaces.includes(marketplace.id) ? 'peer-checked:bg-brand-400 opacity-50 cursor-not-allowed' : 'peer-checked:bg-brand-600'}`}></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
