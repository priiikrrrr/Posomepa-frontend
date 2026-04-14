import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import PageHeader from '../../src/components/PageHeader';
import { useThemeColors, getShadows, spacing, borderRadius } from '../../src/utils/theme';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const shadows = getShadows(isDark);
  const [name, setName] = useState(user?.name || '');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');

  const sendOTPMutation = useMutation({
    mutationFn: (phone) => authAPI.sendPhoneUpdateOTP(phone),
    onSuccess: (data) => {
      setShowOTPModal(true);
      if (data.data?.dev) {
        Alert.alert('Dev Mode', `OTP is printed in backend console`);
      } else {
        Alert.alert('OTP Sent', 'Verification code sent to your phone');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: ({ phone, otp }) => authAPI.verifyPhoneUpdateOTP(phone, otp),
    onSuccess: (response) => {
      const updatedUser = response.data?.user;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      setShowOTPModal(false);
      setOtp('');
      setPendingPhone('');
      Alert.alert('Success', 'Phone number updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify OTP');
    },
  });

  const handleSaveName = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }
    authAPI.updateProfile({ name: name.trim() })
      .then((response) => {
        const updatedUser = response.data?.user;
        if (updatedUser) {
          updateUser(updatedUser);
        }
        Alert.alert('Success', 'Name updated successfully');
      })
      .catch((error) => {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update name');
      });
  };

  const handleSendOTP = () => {
    const cleanPhone = pendingPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    sendOTPMutation.mutate(cleanPhone);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }
    verifyOTPMutation.mutate({ phone: pendingPhone, otp });
  };

  const handlePhoneChange = (text) => {
    const cleanText = text.replace(/\D/g, '');
    if (cleanText.length <= 10) {
      setPendingPhone(cleanText);
    }
  };

  const isGmailUser = user?.email?.toLowerCase().includes('gmail.com') || 
                      user?.email?.toLowerCase().includes('google.com') ||
                      user?.firebaseUid;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader title="Edit Profile" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Username</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textLight}
                maxLength={50}
              />
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveName}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>{name.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number</Text>
            {user?.phone && user?.phoneVerified ? (
              <View style={[styles.verifiedPhoneRow, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.verifiedPhoneText, { color: colors.success }]}>{user.phone}</Text>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  value={pendingPhone}
                  onChangeText={handlePhoneChange}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor={colors.textLight}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={[styles.updateButton, { backgroundColor: colors.primary }]}
                  onPress={handleSendOTP}
                  disabled={sendOTPMutation.isPending || pendingPhone.length !== 10}
                >
                  {sendOTPMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}
            {(!user?.phone || !user?.phoneVerified) && (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Verify your phone number to receive booking updates
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Information</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.email || 'Not set'}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.phone || 'Not verified'}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.role || 'user'}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Login Method</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{isGmailUser ? 'Google' : 'Email'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showOTPModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOTPModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Verify Phone</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowOTPModal(false);
                  setOtp('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to +91 {pendingPhone}
            </Text>
            
            <TextInput
              style={[styles.otpInput, { backgroundColor: colors.gray100, color: colors.textPrimary }]}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
            
            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: colors.primary }]}
              onPress={handleVerifyOTP}
              disabled={verifyOTPMutation.isPending || otp.length !== 6}
            >
              {verifyOTPMutation.isPending ? (
                <Text style={[styles.verifyButtonText, { color: colors.white }]}>Verifying...</Text>
              ) : (
                <Text style={[styles.verifyButtonText, { color: colors.white }]}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  form: { padding: spacing.xl },
  inputGroup: { marginBottom: spacing.xxl },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: 16, borderWidth: 1 },
  inputFlex: { flex: 1 },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: spacing.xs },
  updateButton: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  verifiedPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: borderRadius.lg },
  verifiedPhoneText: { fontSize: 16, fontWeight: '500' },
  helperText: { fontSize: 12, marginTop: spacing.xs },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  infoCard: { borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  modalContent: { borderRadius: 24, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalSubtitle: { fontSize: 14, marginBottom: spacing.lg, textAlign: 'center' },
  otpInput: { borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: 24, marginBottom: spacing.lg, letterSpacing: 8, textAlign: 'center' },
  verifyButton: { borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  verifyButtonText: { fontSize: 16, fontWeight: '600' },
});