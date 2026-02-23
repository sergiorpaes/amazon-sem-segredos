import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../services/languageService';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { supportWhatsapp } = useSettings();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const normalizedPlan = user?.plan_name?.toUpperCase() || 'FREE';
    const hasPremiumSupport = ['PRO', 'PREMIUM'].includes(normalizedPlan);

    const handleWhatsappClick = () => {
        if (supportWhatsapp) {
            const cleanNumber = String(supportWhatsapp).replace(/\D/g, '');
            const text = t('support.whatsapp_text');
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/.netlify/functions/support-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    subject,
                    message,
                    userEmail: user?.email,
                    userName: user?.full_name || t('profile.user_placeholder')
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t('support.error_send'));
            }

            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setSubject('');
                setMessage('');
            }, 3000);
        } catch (error: any) {
            console.error('Support ticket error:', error);
            setStatus('error');
            setErrorMessage(error.message || t('support.error_default'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('support.modal_title')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('support.modal_subtitle')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('support.success_title')}</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('support.success_desc')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {hasPremiumSupport && supportWhatsapp && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                                            <MessageCircle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-green-800 dark:text-green-300">{t('support.vip_title')}</h3>
                                            <p className="text-xs text-green-700 dark:text-green-400">{t('support.vip_desc')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleWhatsappClick}
                                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <MessageCircle size={18} />
                                        {t('support.whatsapp_button')}
                                    </button>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-gray-100 dark:border-dark-600"></span>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-green-50 dark:bg-dark-800 px-2 text-gray-400 font-medium">{t('support.or_ticket')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.subject_label')}</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder={t('support.subject_placeholder')}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-lg"
                                        required
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.message_label')}</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={t('support.message_placeholder')}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none rounded-lg h-32 resize-none"
                                        required
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                {status === 'error' && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
                                        <AlertCircle size={16} className="mt-0.5" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                        disabled={status === 'loading'}
                                    >
                                        {t('support.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading' || !subject.trim() || !message.trim()}
                                        className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {status === 'loading' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                {t('support.send')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
