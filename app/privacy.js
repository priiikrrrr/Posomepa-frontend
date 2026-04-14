import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius } from '../src/utils/theme';

export default function PrivacyScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();

  const currentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>Last Updated: {currentDate}</Text>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. Information We Collect</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We collect personal information including name, email, phone number, profile photo, and identification documents (Aadhaar, PAN, or equivalent) for KYC verification. For hosts, we additionally collect bank account details or UPI ID for processing payouts. We also collect device tokens for push notifications and usage data to improve our services.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. How We Use Information</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We use your information to: provide and improve our services, verify your identity, process bookings, communicate with you, and comply with legal obligations.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3. Data Sharing</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We share limited information with hosts when a booking is confirmed — specifically the guest's name and contact number. We share host contact details with guests only after payment is confirmed. Payment data is processed by Razorpay and subject to their privacy policy. We do not sell your data to third parties. Identity documents collected during KYC are used solely for verification purposes.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>4. Data Security</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We implement reasonable measures to protect your data. However, no method of electronic storage is 100% secure. We cannot guarantee absolute security.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>5. Cookies & Tracking</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We may use cookies and similar technologies to enhance user experience and analyze platform usage.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>6. User Rights</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            You may request access, correction, or deletion of your personal data by contacting us. We will respond to such requests within a reasonable timeframe.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>7. Data Retention</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We retain data as long as necessary for providing services and complying with legal obligations. Inactive accounts may be deleted after a reasonable period.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>8. Third-Party Services</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Our platform may contain links to third-party websites. We are not responsible for the privacy practices of those websites.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>9. Updates to Policy</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            This Privacy Policy may be updated periodically. We will notify you of any material changes via the app or email.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>10. Contact Us</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            If you have any questions about this Privacy Policy, please contact us at support@posomepa.com
          </Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  section: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
