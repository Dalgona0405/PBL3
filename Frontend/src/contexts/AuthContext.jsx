import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosClient, { getAccessToken, setAccessToken, refreshAccessToken } from '../api/axiosClient';
import { API_URLS } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        localStorage.removeItem('token');
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isAuthReady, setIsAuthReady] = useState(() => !localStorage.getItem('user') || Boolean(getAccessToken()));

    useEffect(() => {
        if (isAuthReady) return;
        let mounted = true;

        refreshAccessToken()
            .then((data) => {
                if (!mounted) return;
                if (data?.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setUser(data.user);
                }
            })
            .catch(() => {
                if (!mounted) return;
                setAccessToken(null);
                localStorage.removeItem('user');
                setUser(null);
            })
            .finally(() => {
                if (mounted) setIsAuthReady(true);
            });

        return () => { mounted = false; };
    }, [isAuthReady]);

    const login = (userData, token) => {
        setAccessToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('token');
        setUser(userData);
        setIsAuthReady(true);
    };

    const logout = () => {
        setAccessToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        axiosClient.post(API_URLS.LOGOUT).catch(() => {});
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthReady }}>
            {isAuthReady ? children : (
                <div className="min-h-screen flex items-center justify-center bg-cream text-olive font-semibold animate-pulse">
                    Đang khôi phục phiên đăng nhập... 🌿
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);