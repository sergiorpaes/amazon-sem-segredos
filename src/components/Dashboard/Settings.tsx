import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, ShieldCheck, Lock, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { connectToAmazon, saveCredentials as saveToStorage, loadCredentials, AmazonCredentials, Region } from '../../services/amazonAuthService';

export const Settings: React.FC = () => {
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
        checkConnection();
    }, [activeRegion]);

    const checkConnection = async () => {
        setMessage('');
        setTempAccessToken(null);
        setStatus('loading');
        setIsServerSecured(false);

        try {
            // 1. Try to connect using ONLY server credentials (empty body payload for sensitive fields)
            // We pass the region so the backend knows which Env Vars to read
            const data = await connectToAmazon({
                clientId: '', clientSecret: '', refreshToken: '',
                region: activeRegion
            });

            // If successful, we are secured!
            if (data.access_token) {
                setStatus('success');
                setIsServerSecured(true);
                setMessage(`Conexão Segura Estabelecida (${activeRegion}) via Servidor.`);

                // Should we show local creds if they exist? No, prefer server.
                setCredentials({
                    clientId: '', clientSecret: '', refreshToken: '',
                    grantType: 'refresh_token', apiUrl: 'https://api.amazon.com/auth/o2/token'
                });
            }
        } catch (err) {
            // Server connection failed, falling back to local check or idle
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
                setStatus('idle'); // Let user manually test if they rely on local
                setMessage('Configuração de servidor não detectada. Usando credenciais locais.');
                setShowAdvanced(true); // Open inputs so they can see what's wrong
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
                // User might be trying to re-trigger server check
                await checkConnection();
                return;
            }

            await connectToAmazon({ ...credentials, region: activeRegion });
            saveToStorage(credentials, activeRegion);
            setStatus('success');
            setMessage('Credenciais locais salvas e verificadas com sucesso.');
            setIsServerSecured(false); // Manually overridden
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
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-100 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Segurança da API</h1>
                    <p className="text-gray-500 text-sm">Gerenciamento seguro de chaves de acesso.</p>
                </div>
            </div>

            <div className="flex space-x-2 border-b border-gray-200 mb-6">
                {regions.map((region) => (
                    <button
                        key={region.id}
                        onClick={() => setActiveRegion(region.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeRegion === region.id
                                ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <span className="mr-2">{region.flag}</span>
                        {region.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">

                {/* Secure Status Card */}
                <div className={`rounded-xl p-6 border mb-8 flex items-center justify-between ${isServerSecured
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isServerSecured ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                            {isServerSecured ? <Lock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className={`font-semibold ${isServerSecured ? 'text-green-800' : 'text-gray-700'}`}>
                                {isServerSecured ? 'Ambiente Seguro Ativo' : 'Configuração de Servidor Ausente'}
                            </h3>
                            <p className={`text-sm ${isServerSecured ? 'text-green-700' : 'text-gray-500'}`}>
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

                {/* Manual Override Section */}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                                <input
                                    type="text"
                                    name="clientId"
                                    value={credentials.clientId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
    );
};
