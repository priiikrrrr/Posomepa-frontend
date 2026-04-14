import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing, ActivityIndicator, RefreshControl, Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { bookingsAPI, spacesAPI, authAPI, hostApplicationAPI, messagesAPI } from '../../src/api/client';
import BookingCard from '../../src/components/BookingCard';
import { useThemeColors, spacing, borderRadius, shadows } from '../../src/utils/theme';
import { headerGradients } from '../../src/utils/appTheme';

const { width, height } = Dimensions.get('window');

const StatCard = ({ icon, label, value, sublabel, gradientColors, colors }) => (
  <LinearGradient
    colors={gradientColors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.statCard}
  >
    <View style={styles.statIconContainer}>
      <Ionicons name={icon} size={24} color={colors.white} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statSublabel}>{sublabel}</Text>
  </LinearGradient>
);

const MenuItem = ({ icon, label, description, onPress, color, hasUnread, colors }) => (
  <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconContainer, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.menuContent}>
      <View style={styles.menuLabelRow}>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
        {hasUnread && <View style={styles.unreadDot} />}
      </View>
      <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
  </TouchableOpacity>
);

export default function HostDashboard() {
  const router = useRouter();
  const { logout, user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [freshUserData, setFreshUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const streak = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const roundTrip = (anim, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    };
    roundTrip(wave1, 6000).start();
    roundTrip(wave2, 8000, 1500).start();
    roundTrip(wave3, 5000, 800).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(streak, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(streak, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(2000),
    ])).start();
  }, []);

  const b1Y = wave1.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  const b1X = wave1.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const b2Y = wave2.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const b2X = wave2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const b3Y = wave3.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const streakX = streak.interpolate({ inputRange: [0, 1], outputRange: [-300, 500] });
  const streakOpacity = streak.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.6, 0.6, 0] });

  useEffect(() => {
    const refreshUser = async () => {
      setLoadingUser(true);
      try {
        const response = await authAPI.getMe();
        setFreshUserData(response.data);
        updateUser(response.data);
      } catch (e) {
        setFreshUserData(user);
      } finally {
        setLoadingUser(false);
      }
    };
    refreshUser();
  }, []);

  const { data: appData, isLoading: loadingApp, refetch: refetchApp } = useQuery({
    queryKey: ['hostApplication'],
    queryFn: () => hostApplicationAPI.getMy().then(res => res.data),
  });

  const displayUser = freshUserData || user;
  const application = appData?.application;
  const applicationStatus = application?.status;
  const rejectionReason = application?.rejectionReason;
  const canResubmitAt = application?.canResubmitAt;

  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (applicationStatus === 'rejected' && canResubmitAt) {
      const updateTimer = () => {
        const now = new Date();
        const resubmitTime = new Date(canResubmitAt);
        const diff = resubmitTime - now;
        if (diff <= 0) { setTimeRemaining('You can now resubmit'); return; }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
    setTimeRemaining('');
  }, [applicationStatus, canResubmitAt]);

  const { data: hostData, isLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['hostBookings'],
    queryFn: () => bookingsAPI.getHostBookings({ limit: 100 }).then(res => res.data),
  });

  const { data: spacesData, refetch: refetchSpaces } = useQuery({
    queryKey: ['mySpaces'],
    queryFn: () => spacesAPI.getMy({ limit: 100 }).then(res => res.data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchApp(), refetchBookings(), refetchSpaces()]);
    setRefreshing(false);
  }, [refetchApp, refetchBookings, refetchSpaces]);

  const handleResubmit = async () => {
    try {
      await hostApplicationAPI.resubmit();
      refetchApp();
    } catch (error) {
      console.log('Resubmit error:', error);
    }
  };

  const { data: messagesData } = useQuery({
    queryKey: ['hostMessages'],
    queryFn: () => messagesAPI.getHostMessages().then(res => res.data),
    enabled: applicationStatus === 'verified',
  });

  const stats = hostData?.stats || {};
  const totalSpaces = spacesData?.spaces?.length || 0;
  const allBookings = hostData?.bookings || [];
  const recentBookings = allBookings.filter(b => b.paymentStatus === 'paid').slice(0, 5);

  const statCards = [
    { icon: 'home', label: 'My Properties', value: totalSpaces, sublabel: 'Listed', gradientColors: ['#C4B5FD', '#8B5CF6'] },
    { icon: 'close-circle', label: 'Cancelled', value: allBookings.filter(b => b.status === 'cancelled').length, sublabel: 'Bookings', gradientColors: ['#FCA5A5', '#EF4444'] },
    { icon: 'checkmark-circle', label: 'Completed', value: allBookings.filter(b => b.status === 'completed').length, sublabel: 'Bookings', gradientColors: ['#FBCFE8', '#EC4899'] },
    { icon: 'wallet', label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, sublabel: 'Earned', gradientColors: ['#DDD6FE', '#A78BFA'] },
  ];

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Add New Property', description: 'List a new space', route: '/admin/spaces', color: '#8B5CF6' },
    { icon: 'calendar-outline', label: 'All Bookings', description: 'View all bookings on your properties', route: '/host/bookings', color: '#EC4899' },
    { icon: 'chatbubbles-outline', label: 'Messages', description: 'View messages from users', route: '/host/messages', color: '#14B8A6', hasUnread: messagesData?.unreadCount > 0 },
  ];

  if (loadingUser || loadingApp) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // NOT APPLIED
  if (!application) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={['#F3E8FF', '#EDE9FE', '#DDD6FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <ScrollView contentContainerStyle={styles.notAppliedContainer}>
          <View style={styles.notAppliedHeader}>
            <Ionicons name="home" size={80} color={colors.primary} />
            <Text style={[styles.notAppliedTitle, { color: colors.textPrimary }]}>Become a Host</Text>
            <Text style={[styles.notAppliedSubtitle, { color: colors.textSecondary }]}>Start earning by listing your properties on PosomePa</Text>
          </View>
          <View style={[styles.benefitsList, { backgroundColor: colors.surface }]}>
            {[
              { icon: 'cash-outline', color: '#16A34A', text: 'Earn extra income from your properties' },
              { icon: 'calendar-outline', color: '#2563EB', text: 'Manage bookings easily from your dashboard' },
              { icon: 'shield-checkmark-outline', color: '#7C3AED', text: 'Secure verification process' },
            ].map((b, i) => (
              <View key={i} style={styles.benefitItem}>
                <Ionicons name={b.icon} size={24} color={b.color} />
                <Text style={[styles.benefitText, { color: colors.textPrimary }]}>{b.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={() => router.push('/host/become-host')}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.applyButtonGradient}>
              <Ionicons name="arrow-forward" size={24} color={colors.white} />
              <Text style={styles.applyButtonText}>Apply Now</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.applyNote}>Application typically reviewed within 24-48 hours</Text>
        </ScrollView>
      </View>
    );
  }

  // PENDING
  if (applicationStatus === 'pending') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={['#F3E8FF', '#EDE9FE', '#DDD6FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <ScrollView contentContainerStyle={styles.pendingContainer}>
          <View style={styles.pendingHeader}>
            <View style={styles.pendingIconContainer}>
              <Ionicons name="time" size={60} color="#F59E0B" />
            </View>
            <Text style={[styles.pendingTitle, { color: colors.textPrimary }]}>Application Under Review</Text>
            <Text style={[styles.pendingSubtitle, { color: colors.textSecondary }]}>Your host application is being reviewed by our team</Text>
          </View>
          <View style={[styles.pendingCard, { backgroundColor: colors.surface }]}>
            <View style={styles.pendingInfo}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <View style={styles.pendingInfoText}>
                <Text style={[styles.pendingInfoLabel, { color: colors.textSecondary }]}>Application Submitted</Text>
                <Text style={[styles.pendingInfoValue, { color: colors.textPrimary }]}>{new Date(application.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={styles.pendingDivider} />
            <View style={styles.pendingInfo}>
              <Ionicons name="hourglass-outline" size={24} color="#F59E0B" />
              <View style={styles.pendingInfoText}>
                <Text style={[styles.pendingInfoLabel, { color: colors.textSecondary }]}>Status</Text>
                <Text style={[styles.pendingInfoValue, { color: colors.textPrimary }]}>Awaiting Review</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.pendingNote, { color: colors.textSecondary }]}>We'll notify you via email once your application is reviewed. This usually takes 24-48 hours.</Text>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // REJECTED
  if (applicationStatus === 'rejected') {
    const canResubmit = timeRemaining === 'You can now resubmit';
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={['#FEE2E2', '#FECACA', '#FCA5A5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <ScrollView contentContainerStyle={styles.rejectedContainer}>
          <View style={styles.rejectedHeader}>
            <View style={[styles.rejectedIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={60} color="#DC2626" />
            </View>
            <Text style={styles.rejectedTitle}>Application Rejected</Text>
            <Text style={[styles.rejectedSubtitle, { color: colors.textSecondary }]}>Unfortunately, your host application was not approved</Text>
          </View>
          <View style={[styles.rejectionCard, { backgroundColor: colors.surface }]}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="alert-circle" size={24} color="#DC2626" />
              <Text style={styles.rejectionLabel}>Rejection Reason</Text>
            </View>
            <Text style={[styles.rejectionReason, { color: colors.textPrimary }]}>{rejectionReason || 'No specific reason provided'}</Text>
          </View>
          {timeRemaining && (
            <View style={[styles.timerCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
              <Text style={styles.timerText}>{timeRemaining}</Text>
            </View>
          )}
          <Text style={[styles.rejectedNote, { color: colors.textSecondary }]}>You can submit a new application after the waiting period. Please address the concerns mentioned above before resubmitting.</Text>
          {canResubmit ? (
            <TouchableOpacity style={styles.resubmitButton} onPress={handleResubmit}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.applyButtonGradient}>
                <Ionicons name="refresh" size={24} color={colors.white} />
                <Text style={styles.applyButtonText}>Resubmit Application</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>Back to Home</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // VERIFIED - Full Dashboard
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />}
      >
        {/* Header: part of scroll so no hard edge */}
        <View style={styles.header}>
          <LinearGradient
            colors={isDark ? headerGradients.home.dark.gradient : headerGradients.home.light.gradient}
            style={StyleSheet.absoluteFillObject}
          />

          <Animated.View style={[styles.auroraBlob1, { transform: [{ translateY: b1Y }, { translateX: b1X }] }]} />
          <Animated.View style={[styles.auroraBlob2, { transform: [{ translateY: b2Y }, { translateX: b2X }] }]} />
          <Animated.View style={[styles.auroraBlob3, { transform: [{ translateY: b3Y }] }]} />

          <Animated.View style={[styles.lightStreak, { transform: [{ translateX: streakX }, { rotate: '-30deg' }], opacity: streakOpacity }]} />

          <LinearGradient
            colors={isDark ? ['transparent', colors.background] : ['transparent', colors.background]}
            locations={[0.55, 1]}
            style={styles.headerBottomFade}
            pointerEvents="none"
          />

          <View style={styles.headerContent}>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.glassButton, isDark ? styles.glassButtonDark : null]}>
                <Ionicons name="arrow-back" size={18} color={isDark ? headerGradients.home.dark.iconColor : headerGradients.home.light.iconColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.nameBlock}>
              <Text style={[styles.headerGreeting, { color: isDark ? headerGradients.home.dark.greetingColor : headerGradients.home.light.greetingColor }]}>Host Dashboard</Text>
              <Animated.Text
                style={[styles.headerName, { color: isDark ? headerGradients.home.dark.nameColor : headerGradients.home.light.nameColor, opacity: pulseOpacity, transform: [{ scale: pulseScale }], textShadowColor: isDark ? headerGradients.home.dark.textShadowColor : headerGradients.home.light.textShadowColor }]}
                numberOfLines={1}
              >
                {displayUser?.name || 'Host'}
              </Animated.Text>
              <View style={[styles.locationPill, isDark ? styles.locationPillDark : null]}>
                <View style={[styles.locationDot, { backgroundColor: isDark ? headerGradients.home.dark.locationDot : headerGradients.home.light.locationDot }]} />
                <Text style={[styles.locationText, { color: isDark ? headerGradients.home.dark.locationTextColor : headerGradients.home.light.locationTextColor }]}>Verified Host</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Scrollable body */}
        <View style={[styles.body, { backgroundColor: colors.background }]}>
          <View style={styles.verifiedHostBanner}>
            <View style={styles.verifyPhoneContent}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <View style={styles.verifyPhoneText}>
                <Text style={styles.verifyPhoneTitle}>Verified Host</Text>
                <Text style={styles.verifyPhoneSubtitle}>You can list properties</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {statCards.map((item, idx) => (
              <StatCard key={idx} {...item} colors={colors} />
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
            {quickActions.map((item, idx) => (
              <MenuItem 
                key={idx} 
                {...item} 
                colors={colors}
                onPress={() => router.push(item.route)} 
              />
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Bookings</Text>
          <View style={styles.bookingsWrapper}>
            {recentBookings.length > 0 ? (
              recentBookings.slice(0, 5).map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  isHost
                  onPress={() => router.push(`/booking/confirmation?id=${booking._id}`)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No bookings yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Your properties haven't been booked yet</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    height: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  auroraBlob1: {
    position: 'absolute',
    width: 340, height: 340, borderRadius: 170,
    top: -160, right: -70,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  auroraBlob2: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 130,
    top: -50, left: -80,
    backgroundColor: 'rgba(13, 148, 136, 0.18)',
  },
  auroraBlob3: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    top: 30, left: '38%',
    backgroundColor: 'rgba(196, 181, 253, 0.2)',
  },
  lightStreak: {
    position: 'absolute',
    width: 60, height: 500,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    top: -150, left: 0, borderRadius: 30,
  },
  headerBottomFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 100,
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
    left: 0, right: 0,
    paddingHorizontal: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  glassButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  glassButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  nameBlock: { gap: 5 },
  headerGreeting: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  headerName: {
    fontSize: 36, fontWeight: '800',
    letterSpacing: -1.2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  locationPill: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    marginTop: 8, gap: 6,
  },
  locationPillDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  locationDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#14B8A6',
  },
  locationText: {
    fontSize: 12, fontWeight: '600',
    color: '#1E0A4A',
  },

  // Body
  body: {
    marginTop: -2,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  statIconContainer: {
    width: 40, height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: { fontSize: 12, fontWeight: '500', color: '#FFFFFF' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: spacing.xs },
  statSublabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  sectionTitle: {
    fontSize: 20, fontWeight: '700',
    marginBottom: spacing.md, marginTop: spacing.md,
  },
  menuCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.08)',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,92,246,0.07)',
  },
  menuIconContainer: {
    width: 48, height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  menuContent: { flex: 1, marginLeft: spacing.lg },
  menuLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  menuLabel: { fontSize: 16, fontWeight: '600' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  menuDescription: { fontSize: 13, marginTop: 2 },

  bookingsWrapper: {
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.08)',
    padding: spacing.xxxl,
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: 13, marginTop: spacing.xs },

  // Banners
  verifiedHostBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  verifyPhoneContent: { flexDirection: 'row', alignItems: 'center' },
  verifyPhoneText: { marginLeft: spacing.md },
  verifyPhoneTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  verifyPhoneSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  loadingContainer: {
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { marginTop: spacing.md, fontSize: 16 },

  notAppliedContainer: {
    flexGrow: 1, padding: spacing.xl,
    alignItems: 'center', justifyContent: 'center',
    minHeight: height * 0.8,
  },
  notAppliedHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  notAppliedTitle: { fontSize: 28, fontWeight: '700', marginTop: spacing.lg },
  notAppliedSubtitle: { fontSize: 16, marginTop: spacing.sm, textAlign: 'center' },
  benefitsList: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl, width: '100%',
  },
  benefitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  benefitText: { fontSize: 15, marginLeft: spacing.md, flex: 1 },
  applyButton: { marginTop: spacing.xxl, width: '100%' },
  applyButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, borderRadius: borderRadius.lg,
  },
  applyButtonText: { fontSize: 18, fontWeight: '600', marginLeft: spacing.sm },
  applyNote: { fontSize: 13, marginTop: spacing.md, textAlign: 'center' },
  pendingContainer: {
    flexGrow: 1, padding: spacing.xl, alignItems: 'center', minHeight: height * 0.8,
  },
  pendingHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  pendingIconContainer: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center',
  },
  pendingTitle: { fontSize: 26, fontWeight: '700', marginTop: spacing.lg },
  pendingSubtitle: { fontSize: 16, marginTop: spacing.sm, textAlign: 'center' },
  pendingCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl, width: '100%',
  },
  pendingInfo: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  pendingInfoText: { marginLeft: spacing.md },
  pendingInfoLabel: { fontSize: 13 },
  pendingInfoValue: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  pendingDivider: { height: 1, backgroundColor: 'rgba(139,92,246,0.1)', marginVertical: spacing.md },
  pendingNote: { fontSize: 14, marginTop: spacing.xxl, textAlign: 'center', paddingHorizontal: spacing.lg },
  rejectedContainer: {
    flexGrow: 1, padding: spacing.xl, alignItems: 'center', minHeight: height * 0.8,
  },
  rejectedHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  rejectedIconContainer: {
    width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center',
  },
  rejectedTitle: { fontSize: 26, fontWeight: '700', color: '#DC2626', marginTop: spacing.lg },
  rejectedSubtitle: { fontSize: 16, marginTop: spacing.sm, textAlign: 'center' },
  rejectionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl, width: '100%',
  },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  rejectionLabel: { fontSize: 15, fontWeight: '600', color: '#DC2626', marginLeft: spacing.sm },
  rejectionReason: { fontSize: 15, lineHeight: 22 },
  timerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg, marginTop: spacing.lg, width: '100%',
  },
  timerText: { fontSize: 15, fontWeight: '600', color: '#F59E0B', marginLeft: spacing.sm },
  rejectedNote: { fontSize: 14, marginTop: spacing.xxl, textAlign: 'center', paddingHorizontal: spacing.lg },
  resubmitButton: { marginTop: spacing.xl, width: '100%' },
  backButtonContainer: { marginTop: spacing.xl, paddingVertical: spacing.md },
  backButtonText: { fontSize: 16, fontWeight: '600' },
});
