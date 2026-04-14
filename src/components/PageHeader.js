import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../utils/theme';

export default function PageHeader({ 
  title, 
  subtitle, 
  onBack, 
  showBack = false,
  rightAction = null
}) {
  return (
    <LinearGradient 
      colors={['#A78BFA', '#C4B5FD', '#EDE9FE', '#F8FAFC']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#1E0A4A" />
            </TouchableOpacity>
          )}
          <View style={styles.titleBlock}>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          {rightAction}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  content: {
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(139, 92, 246, 0.8)',
    marginBottom: 2,
  },
  title: {
    fontSize: 24, fontWeight: '700',
    color: '#1E0A4A',
  },
});
