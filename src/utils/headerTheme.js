export const headerTheme = {
  dark: {
    background: ['#1A0533', '#2D1065', '#3B0F8C', '#1E0A4A'],
    blob1: 'rgba(139, 92, 246, 0.25)',
    blob2: 'rgba(34, 211, 238, 0.15)',
    blob3: 'rgba(244, 63, 94, 0.14)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.55)',
    glass: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.15)',
    glowColor: 'rgba(139, 92, 246, 0.6)',
  },
  light: {
    background: ['#F5F3FF', '#EDE9FE', '#DDD6FE', '#F5F3FF'],
    blob1: 'rgba(139, 92, 246, 0.15)',
    blob2: 'rgba(34, 211, 238, 0.1)',
    blob3: 'rgba(244, 63, 94, 0.08)',
    text: '#1E0A4A',
    textSecondary: 'rgba(30, 10, 74, 0.55)',
    glass: 'rgba(139, 92, 246, 0.08)',
    glassBorder: 'rgba(139, 92, 246, 0.15)',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
};

export const getTheme = (isDark = true) => isDark ? headerTheme.dark : headerTheme.light;
