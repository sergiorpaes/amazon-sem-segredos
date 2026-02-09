
import React, { useState } from 'react';
import { X, Mail, Lock, Phone, MapPin, Building, ChevronRight, ChevronLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../services/languageService';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Fetch plans on mount
    React.useEffect(() => {
        if (step === 3) {
            setLoadingPlans(true);
            fetch('/.netlify/functions/get-plans')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setPlans(data);
                    }
                })
                .catch(err => console.error('Failed to load plans:', err))
                .finally(() => setLoadingPlans(false));
        }
    }, [step]);
    const { login } = useAuth();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        phone: '',
        company_name: '',
        address_street: '',
        address_city: '',
        address_state: '',
        address_zip: ''
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlanSelect = async (plan: any) => {
        setSelectedPlan(plan.name.toLowerCase());
        setLoading(true);
        setError('');

        try {
            // First, create the user
            console.log('Attempting signup with data:', { ...formData, password: '[REDACTED]', selectedPlan: plan.name.toLowerCase() });
            const signupResponse = await fetch('/.netlify/functions/auth-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, selectedPlan: plan.name.toLowerCase(), planId: plan.id })
            });

            const signupData = await signupResponse.json();

            if (!signupResponse.ok) {
                throw new Error(signupData.error || 'Erro ao criar conta');
            }

            if (plan.monthly_price_eur === 0) {
                setSuccessMessage('Cadastro realizado com sucesso! Verifique seu e-mail para ativar sua conta.');
                setLoading(false);
            } else {
                // For Pro/Premium, redirect to checkout
                const priceId = plan.stripe_price_id;

                // Trigger checkout creation
                const checkoutResponse = await fetch('/.netlify/functions/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ priceId, type: 'plan' })
                    // Note: In a real app we'd auto-login here or pass userId if secure. 
                    // For now relying on existing flow or user to login if needed.
                });
                const checkoutData = await checkoutResponse.json();
                if (checkoutData.url) {
                    window.location.href = checkoutData.url;
                } else {
                    setSuccessMessage('Conta criada! Redirecionando para o pagamento...');
                    // Attempt auto-login to fix the "checkout needs auth" issue if it exists?
                    // For now keep simple.
                }
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLogin && !isForgotPassword && step === 2) {
            setStep(3);
            return;
        }

        setError('');
        setSuccessMessage('');
        setLoading(true);

        const endpoint = isLogin ? '/.netlify/functions/auth-login' : '/.netlify/functions/auth-forgot-password';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isForgotPassword ? { email: formData.email } : formData)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Ocorreu um erro');
                throw new Error(errorMessage);
            }

            if (isForgotPassword) {
                setSuccessMessage(data.message || t('auth.reset_email_sent'));
                setLoading(false);
                return;
            }

            login(data.user);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${step === 3 ? 'max-w-4xl' : 'max-w-md'} overflow-hidden relative animate-in fade-in zoom-in duration-300`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {step === 3 ? t('plans.select') : isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {step === 3
                                ? 'Escolha o melhor plano para seu negócio'
                                : isLogin ? 'Acesse sua área administrativa' : 'Comece sua jornada no Amazon AI Suite'
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-100 font-medium">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-bold">Solicitação Recebida!</span>
                            </div>
                            {successMessage}
                        </div>
                    )}

                    {!isLogin && step === 3 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500">
                            {loadingPlans ? (
                                <div className="col-span-3 text-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
                                    <p className="text-gray-500 mt-2">Carregando planos...</p>
                                </div>
                            ) : plans.map((plan) => {
                                const features = typeof plan.features_json === 'string' ? JSON.parse(plan.features_json) : plan.features_json;
                                const isPro = plan.name === 'Pro';
                                const isPremium = plan.name === 'Premium';

                                return (
                                    <div key={plan.id} className={`border ${isPro ? 'border-2 border-brand-500 shadow-xl bg-brand-50/20' : 'border-gray-100 hover:border-brand-500 bg-gray-50/50'} rounded-2xl p-6 transition-all hover:shadow-lg flex flex-col relative group`}>
                                        {isPro && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                Mais Popular
                                            </div>
                                        )}
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{t(`plans.${plan.name.toLowerCase()}`)}</h3>
                                        <div className="text-3xl font-black text-brand-600 mb-6">
                                            {plan.monthly_price_eur === 0 ? t('plans.free') : `€${(plan.monthly_price_eur / 100).toFixed(2)}`}<span className="text-sm font-normal text-gray-500">/mês</span>
                                        </div>
                                        <ul className="space-y-3 mb-8 flex-1">
                                            {features.map((feature: string, idx: number) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                                    <CheckCircle className={`w-4 h-4 ${isPro || isPremium ? 'text-brand-500' : 'text-green-500'}`} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handlePlanSelect(plan)}
                                            disabled={loading}
                                            className={`w-full py-3 rounded-xl font-bold transition-colors ${isPro
                                                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200'
                                                : 'bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-50 group-hover:bg-brand-600 group-hover:text-white'
                                                }`}
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Selecionar ${plan.name}`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isLogin ? (
                                <>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                        />
                                    </div>
                                    {!isForgotPassword && (
                                        <>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="Senha"
                                                    required
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsForgotPassword(true);
                                                        setError('');
                                                        setSuccessMessage('');
                                                    }}
                                                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                                                >
                                                    {t('auth.forgot_password')}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                // Signup Flow
                                <div className="space-y-4">
                                    {step === 1 && (
                                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    placeholder="Email (Principal)"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="Escolha uma senha"
                                                    required
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="Telefone / WhatsApp"
                                                    required
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                            <div className="relative">
                                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="company_name"
                                                    placeholder="Nome da Empresa (Opcional)"
                                                    value={formData.company_name}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="address_street"
                                                    placeholder="Morada / Rua"
                                                    required
                                                    value={formData.address_street}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    name="address_city"
                                                    placeholder="Cidade"
                                                    required
                                                    value={formData.address_city}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                                <input
                                                    type="text"
                                                    name="address_zip"
                                                    placeholder="Cód. Postal"
                                                    required
                                                    value={formData.address_zip}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 flex flex-col gap-4">
                                {!isLogin && step === 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-full bg-brand-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Próximo <ChevronRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        {!isLogin && step === 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="bg-gray-100 text-gray-600 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-brand-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : isForgotPassword ? (
                                                t('auth.send_reset_link')
                                            ) : isLogin ? (
                                                'Entrar'
                                            ) : (
                                                'Finalizar Cadastro'
                                            )}
                                        </button>
                                    </div>
                                )}

                                <p className="text-center text-sm text-gray-500">
                                    {isForgotPassword ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotPassword(false)}
                                            className="text-brand-600 font-bold hover:underline"
                                        >
                                            {t('auth.back_to_login')}
                                        </button>
                                    ) : (
                                        <>
                                            {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsLogin(!isLogin);
                                                    setStep(1);
                                                    setError('');
                                                    setSuccessMessage('');
                                                }}
                                                className="ml-1 text-brand-600 font-bold hover:underline"
                                            >
                                                {isLogin ? 'Cadastre-se' : 'Faça login'}
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
