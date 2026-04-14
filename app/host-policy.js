import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius } from '../src/utils/theme';

export default function HostPolicyScreen() {
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
        <Text style={styles.headerTitle}>Host Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>Last Updated: {currentDate}</Text>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. Eligibility</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            You must be at least 18 years of age and legally permitted to rent or manage the listed space. You must provide accurate identification documents for verification.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. Accurate Listings</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            All information, including photos, pricing, amenities, and descriptions, must be accurate and not misleading. We reserve the right to remove inaccurate listings.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3. Verification Process</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We may request identity and property verification documents. Submission does not guarantee approval. We may reject applications that fail verification.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>4. Pricing & Availability</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Hosts are responsible for setting correct pricing and maintaining accurate availability. Incorrect pricing may result in booking cancellations.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>5. Cancellation Policy</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            If a guest requests cancellation and it is approved by PosomePa admin more than 2 hours before the booking start time, a full refund is issued to the guest and the host will not receive payout for that booking. If approved within 2 hours of start time, no refund is issued and the host receives their payout as normal. Hosts do not have direct control over cancellation approvals — all cancellations are managed by PosomePa admin.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>6. Guest Safety</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Hosts are responsible for maintaining safe and lawful premises. All listed spaces must comply with local safety regulations and building codes.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>7. Compliance with Laws</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Hosts must comply with all applicable local laws, regulations, and required permissions. This includes tax obligations, business licenses, and rental permits.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>8. Platform Rights</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We may suspend, remove, or restrict listings that violate this policy or our Terms & Conditions, without prior notice or compensation.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>9. Liability</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            PosomePa is not responsible for damages, disputes, injuries, or incidents at listed properties. Hosts are solely responsible for their properties and guests.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>10. Payments & Fees</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            All booking payments are collected by PosomePa. Platform fees are deducted from each booking. Hosts must provide valid UPI ID or bank account details during KYC for receiving payouts. Payouts are processed manually by PosomePa admin after each confirmed and completed booking. PosomePa reserves the right to withhold payouts in case of disputes or policy violations.
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
