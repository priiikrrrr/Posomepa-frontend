import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl,
  StyleSheet, SafeAreaView, Animated, Easing, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { bookingsAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import BookingCard from '../../src/components/BookingCard';
import Button from '../../src/components/Button';
import { useThemeColors } from '../../src/utils/theme';
import { headerGradients } from '../../src/utils/appTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ─── Status config ─── */
const STATUS_CONFIG = {
  all:       { icon: 'apps-outline',            color: '#8B5CF6', label: 'All',       bg: '#EDE9FE' },
  requested: { icon: 'time-outline',            color: '#F59E0B', label: 'Pending',   bg: '#FEF3C7' },
  pending:   { icon: 'time-outline',            color: '#F59E0B', label: 'Pending',   bg: '#FEF3C7' },
  confirmed: { icon: 'checkmark-circle-outline', color: '#10B981', label: 'Confirmed', bg: '#ECFDF5' },
  completed: { icon: 'flag-outline',             color: '#3B82F6', label: 'Completed', bg: '#EFF6FF' },
  cancelled: { icon: 'close-circle-outline',     color: '#EF4444', label: 'Cancelled', bg: '#FEF2F2' },
};

/* ─── Stat Badge (reused from HomeScreen) ─── */
function StatBadge({ icon, label, value, accent }) {
  return (
    <View style={[badgeStyles.badge, { borderColor: accent + '30' }]}>
      <LinearGradient colors={[accent + '18', accent + '06']} style={StyleSheet.absoluteFillObject} />
      <Ionicons name={icon} size={14} color={accent} />
      <Text style={[badgeStyles.value, { color: accent }]}>{value}</Text>
      <Text style={badgeStyles.label}>{label}</Text>
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, overflow: 'hidden', flex: 1, justifyContent: 'center',
  },
  value: { fontSize: 12, fontWeight: '800', letterSpacing: -0.3 },
  label: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
});

/* ─── Tab Pill ─── */
function TabPill({ tab, active, onPress, colors }) {
  const cfg = STATUS_CONFIG[tab.value];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[tabStyles.pill, active && { backgroundColor: cfg.color }]}
    >
      {active && (
        <LinearGradient
          colors={[cfg.color + 'FF', cfg.color + 'CC']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      <Ionicons
        name={cfg.icon}
        size={13}
        color={active ? '#fff' : cfg.color}
        style={{ marginRight: 5 }}
      />
      <Text style={[tabStyles.label, { color: active ? '#fff' : colors.textSecondary }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}
const tabStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 30, marginRight: 8, overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  label: { fontSize: 12, fontWeight: '700' },
});

/* ─── Empty State ─── */
function EmptyState({ activeTab, onExplore, colors }) {
  const cfg = STATUS_CONFIG[activeTab];
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [activeTab]);

  return (
    <Animated.View style={[emptyStyles.wrapper, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={[emptyStyles.iconRing, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
        <LinearGradient
          colors={[cfg.color + '20', cfg.color + '08']}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name={cfg.icon} size={36} color={cfg.color} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.textPrimary }]}>
        {activeTab === 'all' ? 'No bookings yet' : `No ${cfg.label.toLowerCase()} bookings`}
      </Text>
      <Text style={[emptyStyles.sub, { color: colors.textLight }]}>
        {activeTab === 'all'
          ? 'Your booked spaces will appear here'
          : `You don't have any ${cfg.label.toLowerCase()} reservations`}
      </Text>
      {activeTab === 'all' && (
        <TouchableOpacity
          onPress={onExplore}
          activeOpacity={0.85}
          style={[emptyStyles.btn, { overflow: 'hidden' }]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <Ionicons name="search-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={emptyStyles.btnText}>Explore Spaces</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
const emptyStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  iconRing: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, marginBottom: 20, overflow: 'hidden',
  },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  sub: { fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  btn: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 30,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

/* ─── Booking Item Row ─── */
function BookingRow({ booking, onPress, colors, index, isDark, isAlmostBooked = false }) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, delay: index * 60, useNativeDriver: true, tension: 80, friction: 10,
      }),
    ]).start();
  }, []);

  const status = booking.status || 'requested';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[rowStyles.card, { backgroundColor: colors.surface }]}
      >
        <View style={[rowStyles.accentBar, { backgroundColor: cfg.color }]} />
        <View style={[rowStyles.imgBox, { backgroundColor: cfg.color + '15' }]}>
          <LinearGradient
            colors={[cfg.color + '25', cfg.color + '10']}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name="home-outline" size={24} color={cfg.color} />
        </View>
        <View style={rowStyles.infoCol}>
          <Text style={[rowStyles.spaceName, { color: colors.textPrimary }]} numberOfLines={1}>
            {booking.space?.name || 'Space Booking'}
          </Text>
          <View style={rowStyles.metaRow}>
            <Ionicons name="location-outline" size={11} color={colors.textLight} />
            <Text style={[rowStyles.metaTxt, { color: colors.textLight }]} numberOfLines={1}>
              {booking.space?.location?.city || 'Premium Location'}
            </Text>
          </View>
          <View style={rowStyles.metaRow}>
            <Ionicons name="calendar-outline" size={11} color={colors.textLight} />
            <Text style={[rowStyles.metaTxt, { color: colors.textLight }]}>
              {booking.date
                ? new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Date TBD'}
            </Text>
          </View>
        </View>
        <View style={rowStyles.rightCol}>
          <View style={[rowStyles.statusPill, { 
            backgroundColor: isAlmostBooked 
              ? '#FEF3C7' 
              : (isDark ? cfg.color + '20' : cfg.bg) 
          }]}>
            <View style={[rowStyles.statusDot, { 
              backgroundColor: isAlmostBooked ? '#F59E0B' : cfg.color 
            }]} />
            <Text style={[rowStyles.statusTxt, { 
              color: isAlmostBooked ? '#F59E0B' : cfg.color 
            }]}>
              {isAlmostBooked ? 'Continue' : cfg.label}
            </Text>
          </View>
          
          {booking.status === 'cancelled' && (
            <View style={[rowStyles.statusPill, { 
              backgroundColor: booking.paymentStatus === 'refunded' ? '#D1FAE5' : '#FEE2E2',
              marginTop: 4
            }]}>
              <View style={[rowStyles.statusDot, { 
                backgroundColor: booking.paymentStatus === 'refunded' ? '#10B981' : '#EF4444' 
              }]} />
              <Text style={[rowStyles.statusTxt, { 
                color: booking.paymentStatus === 'refunded' ? '#10B981' : '#EF4444' 
              }]}>
                {booking.paymentStatus === 'refunded' ? 'Refunded' : 'No Refund'}
              </Text>
            </View>
          )}
          
          {booking.totalAmount && (
            <Text style={[rowStyles.price, { color: colors.textPrimary }]}>
              ₹{booking.totalAmount.toLocaleString('en-IN')}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.textLight} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18, padding: 12,
    shadowColor: '#8B5CF6', shadowOpacity: 0.07,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3, overflow: 'hidden',
  },
  accentBar: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 2 },
  imgBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8, marginRight: 12, overflow: 'hidden', flexShrink: 0,
  },
  infoCol: { flex: 1, gap: 3 },
  spaceName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 11, fontWeight: '500' },
  rightCol: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '800', letterSpacing: -0.4 },
});

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle, colors }) {
  return (
    <View style={shStyles.row}>
      <View>
        <Text style={[shStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[shStyles.sub, { color: colors.textLight }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
const shStyles = StyleSheet.create({
  row: { paddingHorizontal: 16, marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 12, marginTop: 2 },
});

/* ─── Main Screen ─── */
const TABS = [
  { label: 'All',       value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState('confirmed');
  const [refreshing, setRefreshing] = useState(false);

  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const roundTrip = (anim, duration, delay = 0) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
    [roundTrip(wave1, 4000, 0), roundTrip(wave2, 5000, 500), roundTrip(wave3, 6000, 1000)].forEach(a => a.start());
    return () => [wave1, wave2, wave3].forEach(a => a.stopAnimation());
  }, []);

  const b1Y = wave1.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const b1X = wave1.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
  const b2Y = wave2.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
  const b2X = wave2.interpolate({ inputRange: [0, 1], outputRange: [10, -10] });
  const b3Y = wave3.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const b3X = wave3.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });

  const { data: allBookingsData, refetch: refetchAll } = useQuery({
    queryKey: ['myBookings', 'all', user?.id],
    queryFn: () => bookingsAPI.getMy({}).then(res => res.data),
    enabled: !!user,
    retry: 1,
    staleTime: 0,
  });

  const { data, refetch: refetchFiltered } = useQuery({
    queryKey: ['myBookings', activeTab, user?.id],
    queryFn: () => {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      return bookingsAPI.getMy(params).then(res => res.data);
    },
    enabled: !!user,
    retry: 1,
  });

  const allBookings = allBookingsData?.bookings || [];
  const almostBooked = allBookingsData?.almostBooked || [];
  const bookings = data?.bookings || [];

  const confirmed  = allBookings.filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid').length;
  const completed  = allBookings.filter(b => b.status === 'completed' && b.paymentStatus === 'paid').length;
  const cancelled  = allBookings.filter(b => b.status === 'cancelled').length;
  const pending    = allBookings.filter(b => b.status === 'requested').length;

  const getStatCounts = () => {
    switch (activeTab) {
      case 'confirmed': return { active: confirmed, label: 'Confirmed' };
      case 'completed': return { active: completed, label: 'Completed' };
      case 'cancelled': return { active: cancelled, label: 'Cancelled' };
      default: return { active: allBookings.length, label: 'Total' };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAll(), refetchFiltered()]);
    setRefreshing(false);
  };

  const headerGradient = isDark
    ? headerGradients.bookings?.dark?.gradient  ?? ['#1E1B4B', '#2E1065', '#1E293B']
    : headerGradients.bookings?.light?.gradient ?? ['#C4B5FD', '#A78BFA', '#8B5CF6'];

  const theme = isDark ? headerGradients.bookings?.dark : headerGradients.bookings?.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <LinearGradient colors={headerGradient} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[styles.blob1, { transform: [{ translateY: b1Y }, { translateX: b1X }] }]} />
        <Animated.View style={[styles.blob2, { transform: [{ translateY: b2Y }, { translateX: b2X }] }]} />
        <Animated.View style={[styles.blob3, { transform: [{ translateY: b3Y }, { translateX: b3X }] }]} />
        <LinearGradient
          colors={['transparent', colors.background]}
          locations={[0.5, 1]}
          style={styles.headerFade}
          pointerEvents="none"
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerEyebrow, { color: theme?.eyebrowColor || 'rgba(237,233,254,0.8)' }]}>YOUR RESERVATIONS ✦</Text>
            <Text style={[styles.headerTitle, { color: theme?.titleColor || '#F5F3FF', textShadowColor: theme?.textShadowColor || 'rgba(139, 92, 246, 0.5)' }]}>My Bookings</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={[styles.glassButton, theme?.glassButton || {}]}
            activeOpacity={0.8}
          >
            <Ionicons name="add-outline" size={20} color={theme?.iconColor || 'rgba(255,255,255,0.9)'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <BookingRow
            booking={item}
            onPress={() => router.push(`/booking/confirmation?id=${item._id}`)}
            colors={colors}
            index={index}
            isDark={isDark}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.statsRow}>
              <StatBadge
                icon="home-outline"
                label="Total"
                value={`${allBookings.length}`}
                accent="#8B5CF6"
              />
              <StatBadge
                icon={STATUS_CONFIG[activeTab].icon}
                label={STATUS_CONFIG[activeTab].label}
                value={`${getStatCounts().active}`}
                accent={STATUS_CONFIG[activeTab].color}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
              style={styles.tabsScroll}
            >
              {TABS.map(tab => (
                <TabPill
                  key={tab.value}
                  tab={tab}
                  active={activeTab === tab.value}
                  onPress={() => setActiveTab(tab.value)}
                  colors={colors}
                />
              ))}
            </ScrollView>

            <View style={{ marginTop: 8 }}>
              <SectionHeader
                title={
                  activeTab === 'all'
                    ? 'All Reservations'
                    : `${STATUS_CONFIG[activeTab].label} Reservations`
                }
                subtitle={`${bookings.length} booking${bookings.length !== 1 ? 's' : ''} found`}
                colors={colors}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          bookings.length === 0 && (
            <EmptyState
              activeTab={activeTab}
              onExplore={() => router.push('/search')}
              colors={colors}
            />
          )
        }
        ListFooterComponent={
          almostBooked.length > 0 && activeTab === 'all' ? (
            <View style={{ marginTop: 16, paddingBottom: 100 }}>
              <SectionHeader
                title="Almost Booked"
                subtitle="Complete your payment to confirm"
                colors={colors}
              />
              {almostBooked.map((booking, index) => (
                <BookingRow
                  key={booking._id}
                  booking={booking}
                  onPress={() => router.push(`/booking/confirmation?id=${booking._id}`)}
                  colors={colors}
                  index={index}
                  isDark={isDark}
                  isAlmostBooked={true}
                />
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={[styles.listContent, bookings.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { height: 160, position: 'relative', overflow: 'hidden' },
  blob1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -130, right: -50, backgroundColor: 'rgba(139,92,246,0.28)' },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, left: -60, backgroundColor: 'rgba(13,148,136,0.16)' },
  blob3: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: 0, left: '35%', backgroundColor: 'rgba(196,181,253,0.35)' },
  headerFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  headerContent: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    paddingHorizontal: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 3 },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -1, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 },
  glassButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  tabsScroll: { marginTop: 16 },
  tabsContent: { paddingHorizontal: 16, paddingBottom: 4 },
  listContent: { paddingBottom: 110 },
});
