import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI, storage } from '../api/client';
import firebaseAuth from '../services/firebaseAuth';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('token');
      const storedUser = await storage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Fetch fresh user data from backend to get latest status
        try {
          const response = await authAPI.getMe();
          const freshUser = response.data;
          setUser(freshUser);
          await storage.setItem('user', JSON.stringify(freshUser));
        } catch (e) {
          console.log('Could not refresh user data:', e.message);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;
      
      if (firebaseUser) {
        // Check if stored user registered with email/password (no Firebase/Google ID)
        const storedUser = await storage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        
        // If stored user has no firebaseUid or googleId, they registered with email/password
        // Don't overwrite their session with Firebase user
        if (parsedUser && !parsedUser.firebaseUid && !parsedUser.googleId) {
          await loadStoredAuth();
          if (isMounted) setLoading(false);
          return;
        }
        
        // Sync Firebase user normally
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await authAPI.verifyFirebaseToken({
            idToken,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            uid: firebaseUser.uid,
            fcmToken: null
          });
          
          const { token: authToken, user: userData } = response.data;
          await storage.setItem('token', authToken);
          await storage.setItem('user', JSON.stringify(userData));
          if (isMounted) {
            setToken(authToken);
            setUser(userData);
          }
        } catch (error) {
          console.log('Error syncing Firebase user to backend:', error);
          await loadStoredAuth();
        }
      } else {
        await loadStoredAuth();
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    loadStoredAuth().then(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: authToken, user: userData } = response.data;
      await storage.setItem('token', authToken);
      await storage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Email login error:', error);
      return { success: false, message: error.response?.data?.message || error.message || 'Login failed' };
    }
  };

  const googleLoginWithFirebase = async () => {
    try {
      const result = await firebaseAuth.signInWithGoogle();
      if (!result.success) {
        return { success: false, message: result.error };
      }
      const idToken = result.idToken;
      const firebaseUser = result.user;
      const googleUser = result.googleUser;
      const response = await authAPI.verifyFirebaseToken({
        idToken,
        email: firebaseUser.email,
        name: googleUser.name || firebaseUser.displayName,
        photoURL: googleUser.photo || firebaseUser.photoURL,
        uid: firebaseUser.uid,
        fcmToken: null
      });
      const { token: authToken, user: userData } = response.data;
      await storage.setItem('token', authToken);
      await storage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: error.response?.data?.message || error.message || 'Google login failed' };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token: authToken, user: userData } = response.data;
      await storage.setItem('token', authToken);
      await storage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: error.response?.data?.message || error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await firebaseAuth.signOut();
      await storage.removeItem('token');
      await storage.removeItem('user');
      setToken(null);
      setUser(null);
      queryClient.clear();
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    storage.setItem('user', JSON.stringify(userData));
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    storage.setItem('user', JSON.stringify(userData));
    storage.setItem('token', authToken);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      isAdmin: user?.role === 'admin',
      loginWithEmail, 
      login,
      googleLoginWithFirebase, 
      register, 
      logout, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return { 
      user: null, 
      token: null, 
      loading: false, 
      isAdmin: false, 
      loginWithEmail: () => {}, 
      login: () => {},
      googleLoginWithFirebase: () => {}, 
      register: () => {}, 
      logout: () => {}, 
      updateUser: () => {} 
    };
  }
  return context;
};
