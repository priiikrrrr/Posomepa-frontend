import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme_preference';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [userPreference, setUserPreference] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Compute effective scheme reactively - no memoization so it updates with system theme
  const getEffectiveScheme = () => {
    if (userPreference === 'light' || userPreference === 'dark') {
      return userPreference;
    }
    // When userPreference is null (system mode), use system scheme
    // Default to 'dark' if system scheme is null (initial render before system is detected)
    return systemColorScheme || 'dark';
  };

  const activeScheme = getEffectiveScheme();
  const isDark = activeScheme === 'dark';

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'light' || val === 'dark') {
        setUserPreference(val);
      } else {
        setUserPreference(null);
      }
      setIsInitialized(true);
    }).catch(() => {
      setUserPreference(null);
      setIsInitialized(true);
    });
  }, []);

  // Listen for system theme changes - re-renders component when system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // This will trigger a re-render with the new system color scheme
      // Since we're not using userPreference here, it will auto-update when system theme changes
      console.log('System theme changed to:', colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setTheme = async (preference) => {
    if (preference === 'system') {
      setUserPreference(null);
      await AsyncStorage.removeItem(THEME_KEY).catch(() => {});
    } else {
      setUserPreference(preference);
      await AsyncStorage.setItem(THEME_KEY, preference).catch(() => {});
    }
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
