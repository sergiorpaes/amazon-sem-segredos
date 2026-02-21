import React, { useState } from 'react';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { SupportModal } from './SupportModal';

export const SupportWidget: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const { supportWhatsapp } = useSettings();

    // Determine if user has premium support (PRO or PREMIUM plans)
    const normalizedPlan = user?.plan_name?.toUpperCase() || 'FREE';
    const hasPremiumSupport = ['PRO', 'PREMIUM'].includes(normalizedPlan);

    const handleSupportClick = () => {
        if (hasPremiumSupport && supportWhatsapp) {
            // Clean the number format just in case
            const cleanNumber = supportWhatsapp.replace(/\D/g, '');
            const text = "Olá! Gostaria de uma ajuda com a plataforma Amazon Sem Segredos IA Suite.";
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            // Open the internal ticket modal
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <button
                onClick={handleSupportClick}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-transform hover:scale-110 isolate"
                style={{
                    backgroundColor: hasPremiumSupport ? '#25D366' : '#2563eb', // WhatsApp green vs Brand blue
                    color: 'white'
                }}
                title={hasPremiumSupport ? "Suporte VIP via WhatsApp" : "Abrir Chamado de Suporte"}
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
