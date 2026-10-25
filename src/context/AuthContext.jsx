import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { getStoredToken, buildApiUrl } from '../services/apiClient';

const AuthContext = createContext(null);

export const TOKEN_KEY = 'veg_storage_auth_token';
export const ALT_TOKEN_KEY = 'vegsense_jwt_token';
export const USER_KEY = 'veg_storage_user_data';

// Helper to get cached user data for instant restore without flash
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredToken() && getStoredUser()));
  const [isInitializing, setIsInitializing] = useState(true);

  // Helper to save token based on rememberMe preference
  const saveAuthSession = (token, user, rememberMe = true) => {
    try {
      // Clear both first to avoid stale duplicates
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ALT_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ALT_TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(ALT_TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Storage error saving auth session:', e);
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Helper to clear token and user data completely
  const clearAuthSession = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ALT_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ALT_TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Storage error clearing auth session:', e);
    }

    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Refresh authenticated user from /api/auth/me
  const refreshAuthenticatedUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      clearAuthSession();
      return null;
    }

    try {
      const data = await apiClient.get('/auth/me');

      if (data && data.authenticated && data.user) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        // Update persistent user cache
        try {
          const isLocal = Boolean(localStorage.getItem(TOKEN_KEY));
          const storage = isLocal ? localStorage : sessionStorage;
          storage.setItem(USER_KEY, JSON.stringify(data.user));
        } catch (e) {}
        return data.user;
      } else {
        clearAuthSession();
        return null;
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearAuthSession();
      }
      return null;
    }
  }, []);

  // Verify existing session on application load
  const verifySession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      await refreshAuthenticatedUser();
    } finally {
      setIsInitializing(false);
    }
  }, [refreshAuthenticatedUser]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Login handler
  const login = async ({ email, password, rememberMe = true }) => {
    try {
      const data = await apiClient.post('/auth/login', { email, password });

      if (!data || !data.success) {
        throw new Error(data?.message || 'Login failed.');
      }

      saveAuthSession(data.token, data.user, rememberMe);

      try {
        localStorage.setItem('vegsense_last_login_email', email.toLowerCase().trim());
        const known = JSON.parse(localStorage.getItem('vegsense_known_emails') || '[]');
        if (!known.includes(email.toLowerCase().trim())) {
          known.push(email.toLowerCase().trim());
          localStorage.setItem('vegsense_known_emails', JSON.stringify(known));
        }
      } catch (e) {}

      return data;
    } catch (err) {
      let errorMsg = err.message;
      if (err.status === 401) {
        errorMsg = 'Invalid email or password.';
      } else if (err.status === 403) {
        errorMsg = err.message || 'Your account has been deactivated. Please contact an administrator.';
      } else if (err.status === 400) {
        errorMsg = err.message || 'Please enter your email and password.';
      }

      const enhancedErr = new Error(errorMsg);
      enhancedErr.status = err.status;
      enhancedErr.code = err.code;
      throw enhancedErr;
    }
  };

  // Registration handler
  const register = async ({ name, email, password }) => {
    try {
      const data = await apiClient.post('/auth/register', { name, email, password });

      if (!data || !data.success) {
        throw new Error(data?.message || 'Registration failed. Please check your information.');
      }

      try {
        localStorage.setItem('vegsense_last_login_email', email.toLowerCase().trim());
        const known = JSON.parse(localStorage.getItem('vegsense_known_emails') || '[]');
        if (!known.includes(email.toLowerCase().trim())) {
          known.push(email.toLowerCase().trim());
          localStorage.setItem('vegsense_known_emails', JSON.stringify(known));
        }
      } catch (e) {}

      return data;
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your information.';
      const enhancedErr = new Error(msg);
      enhancedErr.status = err.status;
      enhancedErr.code = err.code || (err.status === 409 ? 'USER_ALREADY_EXISTS' : 'REGISTRATION_FAILED');
      throw enhancedErr;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout notification request error:', err);
    } finally {
      clearAuthSession();
    }
  };

  // Forgot Password handler
  const forgotPassword = async ({ email }) => {
    return apiClient.post('/auth/forgot-password', { email });
  };

  // Reset Password handler
  const resetPassword = async ({ token, password }) => {
    return apiClient.post('/auth/reset-password', { token, password });
  };

  const value = {
    currentUser,
    isAuthenticated,
    isInitializing,
    authLoading: isInitializing,
    loading: isInitializing,
    login,
    register,
    logout,
    refreshAuthenticatedUser,
    verifySession,
    forgotPassword,
    resetPassword,
    getStoredToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

