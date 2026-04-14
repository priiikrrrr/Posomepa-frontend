import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius } from '../src/utils/theme';

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>Last Updated: {currentDate}</Text>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            By accessing or using PosomePa, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. Platform Role</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            PosomePa acts as an intermediary platform connecting users and hosts. We do not own, manage, or control listed spaces. All bookings are at your own risk.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3. User Accounts</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            You are responsible for maintaining the confidentiality of your account and ensuring all information provided is accurate and up to date.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>4. Bookings & Payments</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            All bookings require immediate payment to confirm the slot. Unpaid booking requests expire after 15 minutes and the time slot is released. All payments are collected by PosomePa. Platform fees are deducted before host payouts. Hosts are paid manually by PosomePa admin after deducting applicable fees.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>5. Cancellations & Refunds</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Paid bookings may be cancelled by submitting a cancellation request through the app. Cancellation requests are reviewed by PosomePa admin. If the booking start time is more than 2 hours away at the time of admin approval, a full refund will be initiated to the original payment method. If the booking start time is within 2 hours, no refund will be issued. Refunds are processed via Razorpay to the original payment source. UPI refunds typically reflect within 2 hours; card refunds may take 5-7 business days.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>6. Prohibited Use</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            You agree not to misuse the platform, post false information, or engage in any unlawful activity. Violations may result in account suspension or removal.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>7. Platform Rights</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We reserve the right to suspend or remove accounts or listings at our discretion, without prior notice, if these Terms are violated.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>8. Limitation of Liability</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            PosomePa is not liable for any disputes, damages, or losses arising from interactions between users and hosts. Use the platform at your own risk.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>9. Modifications</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the new Terms.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>10. Governing Law</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of Indian courts.
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
