import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [features, setFeatures] = useState<AppFeatures>(() => {
        const saved = localStorage.getItem('app_feature_flags');
        return saved ? JSON.parse(saved) : defaultFeatures;
    });

    const [enabledMarketplaces, setEnabledMarketplaces] = useState<string[]>(() => {
        const saved = localStorage.getItem('app_enabled_marketplaces');
        // Default to ALL marketplaces if nothing saved
        // We avoid circular dependency by not importing SUPPORTED_MARKETPLACES here directly if possible, 
        // or we just assume all IDs. For simplicity, let's initialize empty and handle "all" logic 
        // in components or ideally, import the constant.
        // Better: Let's default to a known set or let components handle "empty means all" or "empty means none".
        // Actually, let's import the constant to be safe and robust.
        return saved ? JSON.parse(saved) : [
            'ATVPDKIKX0DER', 'A2EUQ1WTGCTBG2', 'A1AM78C64UM0Y8', 'A2Q3Y263D00KWC',
            'A1RKKUPIHCS9HS', 'A1F83G8C2ARO7P', 'A1PA6795UKMFR9', 'A13V1IB3VIYZZH',
            'APJ6JRA9NG5V4', 'A1805IZSGTT6HS', 'A2NODRKZP88ZB9', 'A1C3SOZRARQ6R3',
            'A33AVAJ2PDY3EV', 'A2VIGQ35RCS4UG', 'A17E79C6D8DWNP', 'A21TJRUUN4KGV',
            'A1VC38T7YXB528', 'A39IBJ37TRP1C6', 'A19VAU5U5O7RUS'
        ];
    });

    useEffect(() => {
        localStorage.setItem('app_feature_flags', JSON.stringify(features));
    }, [features]);

    useEffect(() => {
        localStorage.setItem('app_enabled_marketplaces', JSON.stringify(enabledMarketplaces));
    }, [enabledMarketplaces]);

    const toggleFeature = (feature: keyof AppFeatures) => {
        setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
    };

    const setFeature = (feature: keyof AppFeatures, value: boolean) => {
        setFeatures(prev => ({ ...prev, [feature]: value }));
    };

    const toggleMarketplace = (id: string) => {
        setEnabledMarketplaces(prev => {
            if (prev.includes(id)) {
                // Prevent disabling the last marketplace? Optional but good UX.
                if (prev.length <= 1) return prev;
                return prev.filter(m => m !== id);
            } else {
                return [...prev, id];
            }
        });
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
