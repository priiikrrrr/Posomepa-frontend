/* OLD colors - commented out
import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#0D9488',
  secondaryDark: '#0F766E',
  secondaryLight: '#14B8A6',
  accent: '#F97316',
  accentDark: '#EA580C',
  accentLight: '#FDBA74',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Gradient colors
  gradientStart: '#8B5CF6',
  gradientEnd: '#7C3AED',
  gradientAccent1: '#F97316',
  gradientAccent2: '#EC4899',
  gradientSuccess: '#10B981',
  
  // Card colors
  cardBackground: '#FFFFFF',
  cardBorder: '#F1F5F9',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const gradients = {
  primary: ['#8B5CF6', '#7C3AED'],
  primaryLight: ['#A78BFA', '#8B5CF6'],
  secondary: ['#14B8A6', '#0D9488'],
  accent: ['#FB923C', '#F97316'],
  sunset: ['#F97316', '#EC4899'],
  ocean: ['#06B6D4', '#3B82F6'],
  forest: ['#10B981', '#059669'],
  night: ['#6366F1', '#8B5CF6'],
  
  // Card gradients
  cardOverlay: ['transparent', 'rgba(0,0,0,0.6)'],
  cardShine: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'],
};
*/

import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// ─── Light palette ────────────────────────────────────────────────────────────
export const lightColors = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#14B8A6',
  secondaryDark: '#0D9488',
  accent: '#F97316',
  accentDark: '#EA580C',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#8B5CF6',
  infoLight: '#EDE9FE',
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  overlay: 'rgba(0,0,0,0.5)',
  // Icon bg tints (light)
  iconBgPrimary: '#EDE9FE',
  iconBgPink: '#FDF2F8',
  iconBgInfo: '#EDE9FE',
  iconBgGray: '#F3F4F6',
  iconBgAdmin: '#EDE9FE',
  iconBgError: '#FEF2F2',
  iconBgSuccess: '#DCFCE7',
  iconBgAccent: '#FFEDD5',
};

// ─── Dark palette ─────────────────────────────────────────────────────────────
export const darkColors = {
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  primaryLight: '#C4B5FD',
  secondary: '#2DD4BF',
  secondaryDark: '#14B8A6',
  accent: '#FB923C',
  accentDark: '#F97316',
  background: '#0D0B14',
  surface: '#1E293B',
  surfaceSecondary: '#273549',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textLight: '#94A3B8',
  border: '#334155',
  borderLight: '#1E293B',
  error: '#F87171',
  errorLight: 'rgba(239,68,68,0.15)',
  success: '#4ADE80',
  successLight: 'rgba(34,197,94,0.15)',
  warning: '#FCD34D',
  warningLight: 'rgba(245,158,11,0.15)',
  info: '#A78BFA',
  infoLight: 'rgba(139,92,246,0.15)',
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#1E293B',
  gray100: '#273549',
  gray200: '#334155',
  gray300: '#475569',
  gray400: '#64748B',
  gray500: '#94A3B8',
  overlay: 'rgba(0,0,0,0.7)',
  // Icon bg tints (dark)
  iconBgPrimary: 'rgba(139,92,246,0.18)',
  iconBgPink: 'rgba(244,114,182,0.15)',
  iconBgInfo: 'rgba(139,92,246,0.18)',
  iconBgGray: 'rgba(148,163,184,0.12)',
  iconBgAdmin: 'rgba(139,92,246,0.18)',
  iconBgError: 'rgba(248,113,113,0.15)',
  iconBgSuccess: 'rgba(74,222,128,0.12)',
  iconBgAccent: 'rgba(251,146,60,0.18)',
};

// ─── Hook: call inside any component to get the right color set ───────────────
export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
}

// ─── Static colors export (defaults to light — keep for legacy imports) ───────
export const colors = lightColors;

// Keep gradients for backward compatibility
export const gradients = {
  primary: ['#8B5CF6', '#7C3AED'],
  primaryLight: ['#A78BFA', '#8B5CF6'],
  secondary: ['#14B8A6', '#0D9488'],
  accent: ['#FB923C', '#F97316'],
  sunset: ['#F97316', '#EC4899'],
  ocean: ['#06B6D4', '#3B82F6'],
  forest: ['#10B981', '#059669'],
  night: ['#6366F1', '#8B5CF6'],
  cardOverlay: ['transparent', 'rgba(0,0,0,0.6)'],
  cardShine: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  fontFamily: 'Poppins',
  h1: { fontSize: 32, fontWeight: '700', fontFamily: 'Poppins', color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700', fontFamily: 'Poppins', color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600', fontFamily: 'Poppins', color: colors.textPrimary },
  h4: { fontSize: 18, fontWeight: '600', fontFamily: 'Poppins', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400', fontFamily: 'Poppins', color: colors.textPrimary },
  bodySmall: { fontSize: 14, fontWeight: '400', fontFamily: 'Poppins', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400', fontFamily: 'Poppins', color: colors.textLight },
  button: { fontSize: 16, fontWeight: '600', fontFamily: 'Poppins', letterSpacing: 0.3 },
  overline: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins', letterSpacing: 1, color: colors.textLight, textTransform: 'uppercase' },
};

export const shadows = {
  sm: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Shadows adapt: darker shadow in dark mode feels wrong, so we lighten opacity
export const getShadows = (isDark = false) => ({
  sm: {
    shadowColor: isDark ? '#000' : '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.4 : 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: isDark ? '#000' : '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.5 : 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: isDark ? '#000' : '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.6 : 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
});

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  cardHover: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: colors.white,
    ...typography.button,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonOutlineText: {
    color: colors.primary,
    ...typography.button,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonSecondaryText: {
    color: colors.white,
    ...typography.button,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  gapSm: {
    gap: spacing.sm,
  },
  gapMd: {
    gap: spacing.md,
  },
  gapLg: {
    gap: spacing.lg,
  },
  gapXl: {
    gap: spacing.xl,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: colors.successLight,
    color: colors.success,
  },
  badgeError: {
    backgroundColor: colors.errorLight,
    color: colors.error,
  },
  badgeWarning: {
    backgroundColor: colors.warningLight,
    color: colors.warning,
  },
  badgeInfo: {
    backgroundColor: colors.infoLight,
    color: colors.info,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default {
  colors,
  gradients,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonStyles,
};
