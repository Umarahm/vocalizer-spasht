'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ClientAuth } from '@/lib/auth/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    accessKey: string | null;
    isLoading: boolean;
    login: (accessKey: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessKey, setAccessKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedKey = ClientAuth.getAccessKey();

            if (storedKey) {
                // Validate the stored key with the server
                try {
                    const response = await fetch('/api/auth/validate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ accessKey: storedKey }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        setAccessKey(storedKey);
                        setIsAuthenticated(true);
                    } else {
                        // Clear invalid key
                        ClientAuth.clearAccessKey();
                        setAccessKey(null);
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    // On network error, allow access if key exists (offline mode)
                    setAccessKey(storedKey);
                    setIsAuthenticated(true);
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (accessKey: string): Promise<boolean> => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessKey }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                ClientAuth.setAccessKey(accessKey);
                setAccessKey(accessKey);
                setIsAuthenticated(true);
                setIsLoading(false);
                return true;
            } else {
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            console.error('Login failed:', error);
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        ClientAuth.clearAccessKey();
        setAccessKey(null);
        setIsAuthenticated(false);
    };

    const value: AuthContextType = {
        isAuthenticated,
        accessKey,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
