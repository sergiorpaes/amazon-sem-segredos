import React, { useState } from 'react';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SupportModal } from './SupportModal';
import { useLanguage } from '../../services/languageService';

export const SupportWidget: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const { t } = useLanguage();

    // Determine if user has premium support (PRO or PREMIUM plans)
    const normalizedPlan = user?.plan_name?.toUpperCase() || 'FREE';
    const hasPremiumSupport = ['PRO', 'PREMIUM'].includes(normalizedPlan);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-transform hover:scale-110 isolate"
                style={{
                    backgroundColor: hasPremiumSupport ? '#25D366' : '#2563eb', // WhatsApp green vs Brand blue
                    color: 'white'
                }}
                title={t('support.widget_title')}
            >
                {/* Glow effect behind button */}
                <div
                    className="absolute inset-0 rounded-full blur-md opacity-50 -z-10"
                    style={{ backgroundColor: hasPremiumSupport ? '#25D366' : '#2563eb' }}
                />

                {hasPremiumSupport ? (
                    <MessageCircle size={28} />
                ) : (
                    <HelpCircle size={28} />
                )}
            </button>

            <SupportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};
