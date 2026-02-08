
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    email: string;
    role: string;
    credits: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session (e.g. via a /me endpoint or local storage placeholder)
        // For now we rely on login setting state
        setLoading(false);
    }, []);

    const login = (userData: any) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
        // Ideally call logout endpoint to clear cookie
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
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
