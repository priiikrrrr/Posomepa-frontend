import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors } from '../../src/utils/theme';

export default function TabLayout() {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }],
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: [styles.tabBarLabel, { color: colors.textSecondary }],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={26} 
                color={focused ? colors.primary : colors.textLight} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name={focused ? 'search' : 'search-outline'} 
                size={26} 
                color={focused ? colors.primary : colors.textLight} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name={focused ? 'calendar' : 'calendar-outline'} 
                size={26} 
                color={focused ? colors.primary : colors.textLight} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={26} 
                color={focused ? colors.primary : colors.textLight} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'web' ? 70 : 70,
    paddingBottom: Platform.OS === 'web' ? 8 : 8,
    paddingTop: 4,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
