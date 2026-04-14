import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../utils/theme';
import { headerTheme } from '../utils/appTheme';

export default function CompactHeader({ 
  title, 
  subtitle, 
  showBack = false, 
  onBack, 
  rightAction = false,
  rightIcon = 'settings-outline',
  onRightAction,
  showHostBadge = false,
  hostBadgeText = 'Host',
  variant = 'compact'
}) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const streak = useRef(new Animated.Value(0)).current;
  
  const theme = variant === 'home' ? headerTheme.home : headerTheme.compact;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();

    if (variant === 'home') {
      Animated.loop(Animated.sequence([
        Animated.timing(streak, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(streak, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(2000),
      ])).start();
    }
  }, []);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.8, 0.5],
  });

  const streakX = streak.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 500],
  });
  const streakOpacity = streak.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 0.6, 0.6, 0],
  });

  return (
    <View style={[styles.container, variant === 'home' && styles.homeContainer]}>
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.blob, { backgroundColor: theme.blob1.backgroundColor }]} />
      <View style={[styles.blob2, { backgroundColor: theme.blob2.backgroundColor }]} />
      {variant === 'home' && theme.blob3 && (
        <View style={[styles.blob3, { backgroundColor: theme.blob3.backgroundColor }]} />
      )}
      
      {variant === 'home' && (
        <Animated.View 
          style={[
            styles.lightStreak, 
            { transform: [{ translateX: streakX }, { rotate: '-30deg' }], opacity: streakOpacity }
          ]} 
        />
      )}

      <LinearGradient
        colors={theme.waveMask.colors}
        locations={theme.waveMask.locations}
        style={styles.fadeGradient}
      />

      <View style={styles.content}>
        <View style={styles.row}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: theme.glassButton.backgroundColor, borderColor: theme.glassButton.borderColor }]}>
              <Ionicons name="arrow-back" size={22} color={theme.iconColor} />
            </TouchableOpacity>
          )}
          <View style={styles.titleBlock}>
            <Text style={[styles.sub, { color: theme.subColor || 'rgba(139, 92, 246, 0.75)' }]}>{subtitle || 'PosomePa'}</Text>
            <View style={styles.titleRow}>
              <Animated.Text style={[styles.title, { opacity: shimmerOpacity, color: theme.titleColor, textShadowColor: theme.textShadowColor }]} numberOfLines={1}>
                {title}
              </Animated.Text>
              {showHostBadge && (
                <View style={[styles.hostBadge, { backgroundColor: theme.hostBadge.backgroundColor, borderColor: theme.hostBadge.borderColor }]}>
                  <Text style={[styles.hostBadgeText, { color: theme.hostBadge.textColor }]}>{hostBadgeText}</Text>
                </View>
              )}
            </View>
          </View>
          {rightAction !== false && (
            <TouchableOpacity onPress={onRightAction} style={[styles.actionButton, { backgroundColor: theme.glassButton.backgroundColor, borderColor: theme.glassButton.borderColor }]}>
              <Ionicons name={rightIcon} size={20} color={theme.iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 170,
    position: 'relative',
    overflow: 'hidden',
  },
  homeContainer: {
    height: 220,
  },
  blob: {
    position: 'absolute',
    width: 340, height: 340,
    borderRadius: 170,
    top: -160, right: -70,
  },
  blob2: {
    position: 'absolute',
    width: 260, height: 260,
    borderRadius: 130,
    top: -50, left: -80,
  },
  blob3: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    top: 30, left: '38%',
  },
  lightStreak: {
    position: 'absolute',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    width: 60, height: 500,
    top: -150, left: 0,
    borderRadius: 30,
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 35,
  },
  content: {
    position: 'absolute',
    bottom: 16,
    left: 0, right: 0,
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  hostBadgeText: {
    fontSize: 11, fontWeight: '600',
    textTransform: 'capitalize',
  },
  sub: {
    fontSize: 12, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 28, fontWeight: '800',
    letterSpacing: -0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  actionButton: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
