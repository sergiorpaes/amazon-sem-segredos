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

    useEffect(() => {
        localStorage.setItem('app_feature_flags', JSON.stringify(features));
    }, [features]);

    const toggleFeature = (feature: keyof AppFeatures) => {
        setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
    };

    const setFeature = (feature: keyof AppFeatures, value: boolean) => {
        setFeatures(prev => ({ ...prev, [feature]: value }));
    };

    return (
        <SettingsContext.Provider value={{ features, toggleFeature, setFeature }}>
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
