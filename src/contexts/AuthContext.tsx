
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    email: string;
    role: string;
    credits_balance: number;
    full_name?: string | null;
    profile_image?: string | null;
    phone?: string | null;
    company_name?: string | null;
    plan_name?: string | null;
    stripe_customer_id?: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: any) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const res = await fetch('/.netlify/functions/auth-me');
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
            setUser(null);
        }
    };

    useEffect(() => {
        // Check session on mount
        refreshUser().finally(() => setLoading(false));
    }, []);

    const login = (userData: any) => {
        setUser(userData);
        // Maybe convert 'credits' -> 'credits_balance'?
        // The endpoint returns DB columns so it should be fine if we consistently use credits_balance
    };

    const logout = async () => {
        setUser(null);
        try {
            // Call backend to clear cookie
            // await fetch('/.netlify/functions/auth-logout'); 
        } catch (e) { console.error(e); }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
