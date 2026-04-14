import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors, getShadows, spacing, borderRadius } from '../../src/utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithEmail, googleLoginWithFirebase } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const shadow = getShadows(isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await googleLoginWithFirebase();
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.message || 'Google Sign-In failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithEmail(email, password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.logoSection, { backgroundColor: colors.primary }]}>
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={40} color={colors.white} />
          </View>
          <Text style={styles.appName}>PosomePa</Text>
          <Text style={styles.tagline}>Find your perfect space</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity>
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginButton, { backgroundColor: colors.primary }, shadow.md]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textLight }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            disabled={loading}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.googleButtonText, { color: colors.textPrimary }]}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/otp-login')}
            style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}
            disabled={loading}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons name="call-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.googleButtonText, { color: colors.textPrimary }]}>Continue with Phone</Text>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, { color: colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
              <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  formSection: {
    padding: spacing.xxl,
    marginTop: -20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15,
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  inputIcon: {
    marginLeft: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  eyeButton: {
    padding: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: spacing.lg,
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 2,
  },
  googleIconContainer: {
    marginRight: spacing.md,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontWeight: '600',
    fontSize: 14,
  },
});
