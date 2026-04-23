import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, authAPI } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check current session on mount
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const currentSession = await authAPI.getSession();
      
      if (currentSession) {
        const currentUser = await authAPI.getCurrentUser();
        setUser(currentUser);
        setSession(currentSession);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const data = await authAPI.signIn(email, password);
      setUser(data.user);
      setSession(data.session);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError(error.message || 'Login failed');
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await authAPI.signInWithGoogle();
      // User will be redirected to Google, then back to callback URL
    } catch (error) {
      console.error('Google login failed:', error);
      setAuthError(error.message || 'Google login failed');
      throw error;
    }
  };

  const register = async (email, password, metadata = {}) => {
    try {
      setAuthError(null);
      const data = await authAPI.signUp(email, password, metadata);
      // Note: User may need to verify email before being logged in
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthError(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.signOut();
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setAuthError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthError(error.message || 'Logout failed');
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      await authAPI.resetPassword(email);
    } catch (error) {
      console.error('Password reset failed:', error);
      setAuthError(error.message || 'Password reset failed');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      isAuthenticated, 
      isLoadingAuth,
      authError,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      checkAuth,
    }}>
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
