import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme_preference';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [userPreference, setUserPreference] = useState('light');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const activeScheme = userPreference;
  const isDark = activeScheme === 'dark';

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'light' || val === 'dark') {
        setUserPreference(val);
      }
      setIsInitialized(true);
    }).catch(() => {
      setIsInitialized(true);
    });
  }, []);

  const setTheme = async (preference) => {
    setUserPreference(preference);
    await AsyncStorage.setItem(THEME_KEY, preference).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ isDark, activeScheme, setTheme, userPreference, isInitialized }}>
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
