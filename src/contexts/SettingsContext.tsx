import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface AppFeatures {
    PRODUCT_FINDER: boolean;
    PROFIT_CALCULATOR: boolean;
    LISTING_OPTIMIZER: boolean;
    MENTOR: boolean;
    ADS_MANAGER: boolean;
}

interface SettingsContextType {
    features: AppFeatures;
    toggleFeature: (feature: keyof AppFeatures) => void;
    setFeature: (feature: keyof AppFeatures, value: boolean) => void;
    enabledMarketplaces: string[];
    toggleMarketplace: (id: string) => void;
}

const defaultFeatures: AppFeatures = {
    PRODUCT_FINDER: true,
    PROFIT_CALCULATOR: true,
    LISTING_OPTIMIZER: true,
    MENTOR: true,
    ADS_MANAGER: true, // Keeping it true by default as per existing behavior, but adjustable
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth(); // Need auth to check role

    const [features, setFeatures] = useState<AppFeatures>(defaultFeatures);

    const [enabledMarketplaces, setEnabledMarketplaces] = useState<string[]>([
        'ATVPDKIKX0DER', 'A2EUQ1WTGCTBG2', 'A1AM78C64UM0Y8', 'A2Q3Y263D00KWC',
        'A1RKKUPIHCS9HS', 'A1F83G8C2ARO7P', 'A1PA6795UKMFR9', 'A13V1IB3VIYZZH',
        'APJ6JRA9NG5V4', 'A1805IZSGTT6HS', 'A2NODRKZP88ZB9', 'A1C3SOZRARQ6R3',
        'A33AVAJ2PDY3EV', 'A2VIGQ35RCS4UG', 'A17E79C6D8DWNP', 'A21TJRUUN4KGV',
        'A1VC38T7YXB528', 'A39IBJ37TRP1C6', 'A19VAU5U5O7RUS'
    ]);

    // Load Global Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/.netlify/functions/system-settings');
                if (response.ok) {
                    const data = await response.json();
                    if (data.global_features) setFeatures(data.global_features);
                    if (data.enabled_marketplaces) setEnabledMarketplaces(data.enabled_marketplaces);
                }
            } catch (error) {
                console.error('Failed to load global settings:', error);
            }
        };
        fetchSettings();
    }, []);

    // Save Settings (Admin Only)
    const saveSetting = async (key: string, value: any) => {
        if (user?.role !== 'ADMIN') return;

        try {
            await fetch('/.netlify/functions/system-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Ensure we pass token
                },
                body: JSON.stringify({ key, value })
            });
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
        }
    };

    const toggleFeature = (feature: keyof AppFeatures) => {
        // Optimistic Update
        const newFeatures = { ...features, [feature]: !features[feature] };
        setFeatures(newFeatures);

        // Persist if Admin
        if (user?.role === 'ADMIN') {
            saveSetting('global_features', newFeatures);
        }
    };

    const setFeature = (feature: keyof AppFeatures, value: boolean) => {
        const newFeatures = { ...features, [feature]: value };
        setFeatures(newFeatures);
        if (user?.role === 'ADMIN') {
            saveSetting('global_features', newFeatures);
        }
    };

    const toggleMarketplace = (id: string) => {
        let newMarketplaces: string[];
        if (enabledMarketplaces.includes(id)) {
            if (enabledMarketplaces.length <= 1) return;
            newMarketplaces = enabledMarketplaces.filter(m => m !== id);
        } else {
            newMarketplaces = [...enabledMarketplaces, id];
        }

        setEnabledMarketplaces(newMarketplaces);

        if (user?.role === 'ADMIN') {
            saveSetting('enabled_marketplaces', newMarketplaces);
        }
    };

    return (
        <SettingsContext.Provider value={{ features, toggleFeature, setFeature, enabledMarketplaces, toggleMarketplace }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
