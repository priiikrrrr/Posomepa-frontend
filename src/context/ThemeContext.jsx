import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme_preference';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [userPreference, setUserPreference] = useState('light');
  const [isInitialized, setIsInitialized] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const activeScheme = userPreference;
  const isDark = activeScheme === 'dark';

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const val = await AsyncStorage.getItem(THEME_KEY);
        if (val === 'light' || val === 'dark') {
          setUserPreference(val);
        }
      } catch (e) {
        // Keep default 'light' on error
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = useCallback(async (preference) => {
    setUserPreference(preference);
    try {
      await AsyncStorage.setItem(THEME_KEY, preference);
    } catch (e) {
      // Silent fail
    }
  }, []);

  const value = React.useMemo(() => ({
    isDark,
    activeScheme,
    setTheme,
    userPreference,
    isInitialized: !isLoading
  }), [isDark, activeScheme, setTheme, userPreference, isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

export default ThemeContext;
