import React, { forwardRef, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius, shadows } from '../utils/theme';

const Input = forwardRef(({ 
  label, 
  error, 
  icon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  styles: externalStyles,
  ...props 
}, ref) => {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = error ? colors.error : isFocused ? colors.primary : colors.border;

  const s = externalStyles || createStyles(colors);

  return (
    <View style={[s.container, style]}>
      {label && (
        <Text style={s.label}>{label}</Text>
      )}
      <View style={[
        s.inputContainer, 
        { borderColor },
        isFocused && s.inputFocused
      ]}>
        {icon && (
          <View style={s.iconContainer}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={isFocused ? colors.primary : colors.textSecondary} 
            />
          </View>
        )}
        <TextInput
          ref={ref}
          style={[s.input, inputStyle]}
          placeholderTextColor={colors.textLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={s.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={s.error}>{error}</Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const createStyles = (colors) => StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary || colors.gray50,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  inputFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    ...shadows.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.lg,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});

export default function InputWrapper(props) {
  const colors = useThemeColors();
  const s = createStyles(colors);
  return <Input {...props} styles={s} />;
}