/**
 * Authentication Context
 * ======================
 * Provides authentication state and methods across the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Auth Context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Check if user is authenticated
    const isAuthenticated = Boolean(token && user);
    const isAdmin = user?.role === 'admin';

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    // Token is invalid, clear it
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            } catch (error) {
                console.error('Token validation failed:', error);
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    // Login function
    const login = useCallback(async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (!response.ok) {
            // Explicitly handle 409 Conflict (Single Session)
            if (response.status === 409) {
                throw new Error("Already logged in on another device");
            }

            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();

        // Store token and user
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);

        return data;
    }, []);

    // Logout function - calls backend to clear session
    const logout = useCallback(async () => {
        try {
            // Call backend to clear session
            if (token) {
                await fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local state
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    }, [token]);

    // Create user (admin only)
    const createUser = useCallback(async (userData) => {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create user');
        }

        return await response.json();
    }, [token]);

    // Get all users (admin only)
    const getUsers = useCallback(async () => {
        const response = await fetch('/auth/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch users');
        }

        return await response.json();
    }, [token]);

    // Delete user (admin only)
    const deleteUser = useCallback(async (username) => {
        const response = await fetch(`/auth/users/${username}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete user');
        }

        return await response.json();
    }, [token]);

    // Toggle user active status (admin only)
    const toggleUserActive = useCallback(async (username) => {
        const response = await fetch(`/auth/users/${username}/toggle-active`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to toggle user status');
        }

        return await response.json();
    }, [token]);

    const value = {
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        createUser,
        getUsers,
        deleteUser,
        toggleUserActive
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
