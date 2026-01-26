import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            // Optional: Verify token with backend/Supabase here if needed, 
            // but api.js interceptor will handle 401s on next request.
            // For now, trust local storage but ensure we have both.
            setUser(JSON.parse(storedUser));
        } else {
            // Incomplete session data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await AuthService.login({ email, password });
            if (response.user) {
                setUser(response.user);
                localStorage.setItem('user', JSON.stringify(response.user));
                // Store token for API calls
                if (response.session && response.session.access_token) {
                    localStorage.setItem('token', response.session.access_token);
                }
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
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
