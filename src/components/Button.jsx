import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, gradients, borderRadius, spacing, shadows } from '../utils/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  gradient = true,
  style,
  textStyle,
  fullWidth = false,
  ...props
}) => {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      shimmerAnim.setValue(0);
    }
  }, [loading]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, tension: 300, friction: 20 }),
      Animated.timing(glowAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }),
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          gradient: gradients.secondary,
          textColor: colors.white,
          borderWidth: 0,
          shadow: { ...shadows.md, shadowColor: colors.secondary },
        };
      case 'accent':
        return {
          gradient: gradients.accent,
          textColor: colors.white,
          borderWidth: 0,
          shadow: { ...shadows.md, shadowColor: colors.accent },
        };
      case 'outline':
        return {
          gradient: null,
          textColor: colors.primary,
          borderWidth: 1.5,
          borderColor: colors.primary,
          bgColor: 'transparent',
          shadow: {},
        };
      case 'ghost':
        return {
          gradient: null,
          textColor: colors.primary,
          borderWidth: 0,
          bgColor: 'rgba(139,92,246,0.08)',
          shadow: {},
        };
      case 'danger':
        return {
          gradient: ['#F87171', '#EF4444', '#DC2626'],
          textColor: colors.white,
          borderWidth: 0,
          shadow: { ...shadows.md, shadowColor: colors.error },
        };
      default:
        return {
          gradient: ['#A78BFA', '#8B5CF6', '#7C3AED'],
          textColor: colors.white,
          borderWidth: 0,
          shadow: { ...shadows.md, shadowColor: colors.primary },
          hasArrow: true,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, fontSize: 13, borderRadiusVal: borderRadius.md, iconSize: 14 };
      case 'large':
        return { paddingVertical: spacing.xl, paddingHorizontal: spacing.xxxl, fontSize: 17, borderRadiusVal: borderRadius.xl, iconSize: 20 };
      default:
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, fontSize: 15, borderRadiusVal: borderRadius.lg, iconSize: 17 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });

  const createStyles = (colors) => StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      overflow: 'hidden',
    },
    fullWidth: {
      width: '100%',
    },
    disabled: {
      opacity: 0.45,
    },
    disabledWrapper: {
      opacity: 0.5,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    arrowCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 7,
    },
    iconSpacingLeft: {
      marginRight: spacing.sm,
    },
    iconSpacingRight: {
      marginLeft: spacing.sm,
    },
    iconSpacing: {},
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingShimmer: {
      position: 'absolute',
      left: -60, right: -60, top: -20, bottom: -20,
      backgroundColor: colors.white,
    },
    outlineShadow: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 2,
    },
  });

  const s = createStyles(colors);

  const ButtonContent = (
    <View style={[s.content, iconPosition === 'right' && { flexDirection: 'row-reverse' }]}>
      {icon && (
        <View style={[
          s.iconSpacing,
          iconPosition === 'right' ? s.iconSpacingRight : s.iconSpacingLeft,
        ]}>
          {icon}
        </View>
      )}
      {loading ? (
        <View style={s.loadingRow}>
          <ActivityIndicator color={variantStyles.textColor} size="small" />
          <Animated.View style={[s.loadingShimmer, { opacity: shimmerOpacity }]} />
        </View>
      ) : (
        <>
          <Text style={[
            s.text,
            { fontSize: sizeStyles.fontSize, color: variantStyles.textColor },
            textStyle,
          ]}>
            {title}
          </Text>
          {variantStyles.hasArrow && (
            <View style={s.arrowCircle}>
              <Ionicons name="arrow-forward" size={12} color="#8B5CF6" />
            </View>
          )}
        </>
      )}
    </View>
  );

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };

  const baseButtonStyle = {
    paddingVertical: sizeStyles.paddingVertical,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    borderRadius: sizeStyles.borderRadiusVal,
    borderWidth: variantStyles.borderWidth || 0,
    borderColor: variantStyles.borderColor,
  };

  if ((variantStyles.gradient || variant === 'danger') && gradient && !isDisabled) {
    const glowColor = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.45)'],
    });

    return (
      <Animated.View style={[fullWidth && s.fullWidth, animatedStyle, variantStyles.shadow, isDisabled && s.disabledWrapper]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={[fullWidth && s.fullWidth, style]}
        >
          <LinearGradient
            colors={variantStyles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.base, baseButtonStyle, fullWidth && s.fullWidth]}
          >
            {ButtonContent}
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
              style={[StyleSheet.absoluteFillObject, { borderRadius: sizeStyles.borderRadiusVal }]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              pointerEvents="none"
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if ((variantStyles.gradient || variant === 'danger') && gradient && isDisabled) {
    return (
      <Animated.View style={[fullWidth && s.fullWidth, animatedStyle, s.disabledWrapper]}>
        <View style={[fullWidth && s.fullWidth, style]}>
          <LinearGradient
            colors={variantStyles.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[s.base, baseButtonStyle, fullWidth && s.fullWidth, s.disabled]}
          >
            {ButtonContent}
          </LinearGradient>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[fullWidth && s.fullWidth, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          s.base,
          baseButtonStyle,
          { backgroundColor: variantStyles.bgColor || colors.primary },
          fullWidth && s.fullWidth,
          isDisabled && s.disabled,
          variant === 'outline' && s.outlineShadow,
          style,
        ]}
        {...props}
      >
        {ButtonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button;