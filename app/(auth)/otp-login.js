import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Keyboard, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI, storage } from '../../src/api/client';
import firebaseAuth from '../../src/services/firebaseAuth';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../src/utils/theme';

const OTP_LENGTH = 6;
const RESEND_TIMER = 60;

export default function OTPLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login: authLogin, updateUser } = useAuth();
  
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [existingUserId, setExistingUserId] = useState(null);
  const [existingEmail, setExistingEmail] = useState(null);

  const phoneInputRef = useRef(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const formattedPhone = `+91${phone}`;
      const result = await firebaseAuth.signInWithPhone(formattedPhone);
      
      if (result.success) {
        setConfirmation(result.confirmation);
        setStep('otp');
        setResendTimer(RESEND_TIMER);
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpToVerify) => {
    const currentOtp = otpToVerify || otp;
    
    if (!currentOtp || currentOtp.length < 6) {
      return; // Don't show error for empty input
    }

    if (!confirmation) {
      Alert.alert('Error', 'Please request OTP again');
      return;
    }

    setLoading(true);

    try {
      const result = await firebaseAuth.confirmOTP(confirmation, currentOtp);
      
      if (result.success) {
        const existingToken = await storage.getItem('token');
        const existingUserStr = await storage.getItem('user');
        const existingUser = existingUserStr ? JSON.parse(existingUserStr) : null;
        
        // Send Firebase token to backend for verification and login
        const response = await authAPI.verifyFirebasePhone({
          idToken: result.idToken,
          phone: `+91${phone}`,
          uid: result.user.uid,
          existingToken: existingToken,
          // Send existing user info to help link accounts
          existingUserId: existingUser?._id,
          existingEmail: existingUser?.email,
          existingName: existingUser?.name,
        });
        
        if (response.data.requiresRegistration) {
          // Pre-fill with existing user's info
          setName(response.data.suggestedName || existingUser?.name || '');
          setEmail(response.data.suggestedEmail || existingUser?.email || '');
          // Store the existing user ID and email for later use
          if (response.data.existingUserId) {
            setExistingUserId(response.data.existingUserId);
          } else if (existingUser?._id) {
            setExistingUserId(existingUser._id);
          }
          // Store existing email for linking
          setExistingEmail(existingUser?.email || response.data.suggestedEmail || null);
          setStep('register');
          return;
        }
        
        if (response.data.message === 'This phone number is already linked to another account') {
          Alert.alert('Error', response.data.message);
          return;
        }

        const { token, user } = response.data;
        await storage.setItem('token', token);
        await storage.setItem('user', JSON.stringify(user));
        updateUser(user);
        
        // Refetch user data to ensure latest state
        try {
          const userResponse = await authAPI.getMe();
          updateUser(userResponse.data);
        } catch (e) {
        }
        
        if (params.redirect === 'host' || params.redirect === 'admin') {
          router.replace('/host');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      const result = await firebaseAuth.signInWithPhone(formattedPhone);
      
      if (result.success) {
        setConfirmation(result.confirmation);
        setResendTimer(RESEND_TIMER);
        setOtp('');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.registerWithPhone({ 
        phone: `+91${phone}`, 
        name, 
        email,
        uid: confirmation?.user?.uid,
        existingUserId: existingUserId,
        existingEmail: existingEmail,
      });
      
      const { token, user } = response.data;
      await storage.setItem('token', token);
      await storage.setItem('user', JSON.stringify(user));
      updateUser(user);
      
      // Refetch user data to ensure latest state
      try {
        const userResponse = await authAPI.getMe();
        updateUser(userResponse.data);
      } catch (e) {
      }
      
      if (params.redirect === 'host' || params.redirect === 'admin') {
        router.push('/host');
      } else {
        router.push('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(cleanValue);
    
    if (cleanValue.length === OTP_LENGTH) {
      Keyboard.dismiss();
      // Use setTimeout to ensure state is updated before verifying
      setTimeout(() => handleVerifyOTP(cleanValue), 100);
    }
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Enter Phone Number</Text>
      <Text style={styles.subtitle}>We'll send you an OTP to verify your number</Text>

      <View style={styles.inputContainer}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          ref={phoneInputRef}
          style={styles.phoneInput}
          placeholder="Enter phone number"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to +91{phone}</Text>

      <View style={styles.otpInputContainer}>
        <TextInput
          style={styles.otpTextInput}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          value={otp}
          onChangeText={handleOTPChange}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor={colors.textLight}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (loading || otp.length < OTP_LENGTH) && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading || otp.length < OTP_LENGTH}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Verify & Continue</Text>
        )}
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        {resendTimer > 0 ? (
          <Text style={styles.resendText}>Resend OTP in {resendTimer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
            <Text style={styles.resendLink}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderRegisterStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Complete Registration</Text>
      <Text style={styles.subtitle}>OTP verified! Please complete your profile</Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCompleteRegistration}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Complete Registration</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {step === 'phone' && renderPhoneStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'register' && renderRegisterStep()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  countryCode: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
  },
  otpInputContainer: {
    marginBottom: spacing.xxl,
  },
  otpTextInput: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  buttonDisabled: {
    backgroundColor: colors.gray300,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  resendText: {
    color: colors.textLight,
    fontSize: 14,
  },
  resendLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
