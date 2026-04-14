import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import PageHeader from '../../src/components/PageHeader';
import { useThemeColors, getShadows, spacing, borderRadius } from '../../src/utils/theme';

const currentYear = new Date().getFullYear();

export default function AboutScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const shadows = getShadows(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        title="About"
        showBack={true}
        onBack={() => router.back()}
        variant="simple"
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.logoSection, { backgroundColor: colors.primary }]}>
            <View style={styles.logoContainer}>
              <Ionicons name="home" size={48} color={colors.white} />
            </View>
            <Text style={[styles.appName, { color: colors.white }]}>PosomePa</Text>
            <Text style={[styles.version, { color: 'rgba(255,255,255,0.8)' }]}>Version 1.0.0</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>About PosomePa</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              PosomePa is a modern rental platform designed to simplify the process of finding and booking spaces for various needs. Whether you're looking for office spaces, event halls, studios, or temporary accommodations, we connect you with verified property owners across multiple cities.
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Our platform offers hourly, daily, and monthly booking options, giving you the flexibility to rent spaces according to your convenience. With features like AI-powered recommendations, secure payments, and real-time availability, PosomePa ensures a seamless booking experience.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Features</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight + '20' }]}>
              <Ionicons name="search" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Easy Search & Discovery</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Find spaces across multiple categories with smart recommendations</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.secondaryLight + '20' }]}>
              <Ionicons name="calendar" size={20} color={colors.secondary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Flexible Booking</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Book by hour, day, or month based on your needs</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.successLight + '20' }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Secure Payments</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Safe and secure payment processing via Razorpay</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accentLight + '20' }]}>
              <Ionicons name="star" size={20} color={colors.accent} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>AI Recommendations</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Personalized suggestions based on your preferences</Text>
            </View>
          </View>

          <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Get in Touch</Text>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('mailto:support@posomepa.com')}
            >
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>support@posomepa.com</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('tel:+911234567890')}
            >
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>+91 12345 67890</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.copyright}>
            <Text style={[styles.copyrightText, { color: colors.textLight }]}>
              © {currentYear} PosomePa. All rights reserved.
            </Text>
            <Text style={[styles.copyrightText, { color: colors.textLight }]}>
              Made with ❤️ in India
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: spacing.xl },
  logoSection: { alignItems: 'center', padding: spacing.xxl, borderRadius: borderRadius.xl, marginBottom: spacing.xl },
  logoContainer: { width: 80, height: 80, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  appName: { fontSize: 28, fontWeight: '700' },
  version: { fontSize: 14, marginTop: spacing.xs },
  card: { borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md },
  description: { fontSize: 14, lineHeight: 22, marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.lg },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  featureIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  featureContent: { flex: 1, marginLeft: spacing.md },
  featureTitle: { fontSize: 14, fontWeight: '600' },
  featureDesc: { fontSize: 12, marginTop: 2 },
  contactCard: { borderRadius: borderRadius.xl, padding: spacing.xl, marginTop: spacing.lg },
  contactTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  contactText: { fontSize: 14, marginLeft: spacing.sm },
  copyright: { alignItems: 'center', marginTop: spacing.xxl, paddingBottom: spacing.xxl },
  copyrightText: { fontSize: 12, marginBottom: spacing.xs },
});
