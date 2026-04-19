import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  Alert, StyleSheet, Animated, Easing, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors, getShadows, spacing, borderRadius } from '../../src/utils/theme';

const { width, height } = Dimensions.get('window');
const AVATAR_SIZE = 74;
const ORBIT_R = AVATAR_SIZE / 2 + 14;

// ─── Single revolving orb ────────────────────────────────────────────────────
const Orb = ({ size, color, duration, phase = 0, maxOpacity = 1 }) => {
  const t = useRef(new Animated.Value(phase)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(t, {
        toValue: phase + 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const steps = [phase, phase + 0.25, phase + 0.5, phase + 0.75, phase + 1];
  const tx = t.interpolate({ inputRange: steps, outputRange: [ORBIT_R, 0, -ORBIT_R, 0, ORBIT_R] });
  const ty = t.interpolate({ inputRange: steps, outputRange: [0, -ORBIT_R, 0, ORBIT_R, 0] });
  const op = t.interpolate({ inputRange: steps, outputRange: [maxOpacity, maxOpacity * 0.35, maxOpacity * 0.1, maxOpacity * 0.35, maxOpacity] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        shadowColor: color, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
        elevation: 8,
        transform: [{ translateX: tx }, { translateY: ty }],
        opacity: op,
      }}
    />
  );
};

// ─── Glow Avatar ─────────────────────────────────────────────────────────────
const GlowAvatar = ({ user, isDark }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const isVerified = user?.hostApplicationStatus === 'verified' || user?.role === 'host';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const ringScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.22] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.75] });

  return (
    <View style={styles.avatarShell}>
      {/* Pulsing glow ring */}
      <Animated.View style={[
        styles.pulseRing,
        {
          borderColor: isVerified ? '#10B981' : '#A78BFA',
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        },
      ]} />

      {/* Three orbiting lights */}
      <Orb size={13} color="#A78BFA" duration={2800} phase={0}    maxOpacity={1.0} />
      <Orb size={9}  color="#C4B5FD" duration={2800} phase={0.5}  maxOpacity={0.75} />
      <Orb size={7}  color="#F0ABFC" duration={3800} phase={0.25} maxOpacity={0.6} />

      {/* Avatar disc */}
      <LinearGradient
        colors={isDark ? ['#6D28D9', '#3B0764'] : ['#A78BFA', '#7C3AED']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.avatarDisc}
      >
        <Text style={styles.avatarLetter}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </LinearGradient>

      {isVerified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark" size={11} color="#fff" />
        </View>
      )}
    </View>
  );
};

// ─── Theme toggle ─────────────────────────────────────────────────────────────
const ThemeToggle = ({ colors }) => {
  const { setTheme, userPreference } = useTheme();
  const active = userPreference || 'light';
  const opts = [
    { k: 'light',  icon: 'sunny-outline' },
    { k: 'dark',   icon: 'moon-outline' },
  ];
  return (
    <View style={[styles.toggleTrack, { backgroundColor: 'rgba(139,92,246,0.08)' }]}>
      {opts.map(o => (
        <TouchableOpacity
          key={o.k}
          onPress={() => setTheme(o.k)}
          style={[styles.toggleOpt, active === o.k && styles.toggleOptActive]}
          activeOpacity={0.8}
        >
          <Ionicons name={o.icon} size={14} color={active === o.k ? '#fff' : colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Menu row ────────────────────────────────────────────────────────────────
const Row = ({ icon, label, desc, iconColor, iconBg, onPress, danger, last, colors }) => (
  <>
    <TouchableOpacity style={[styles.row, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.errorLight : iconBg }]}>
        <Ionicons name={icon} size={17} color={danger ? colors.error : iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.rowLabel, { color: danger ? colors.error : colors.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {label}
        </Text>
        {desc ? <Text style={[styles.rowDesc, { color: colors.textLight }]}>{desc}</Text> : null}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={14} color={colors.textLight} />}
    </TouchableOpacity>
    {!last && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
  </>
);

// ─── ProfileScreen ────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();

  // Aurora blob animations
  const b1 = useRef(new Animated.Value(0)).current;
  const b2 = useRef(new Animated.Value(0)).current;
  const b3 = useRef(new Animated.Value(0)).current;
  const b4 = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    const blob = (a, dur, delay) => Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    blob(b1, 5500, 0);
    blob(b2, 7000, 900);
    blob(b3, 6500, 400);
    blob(b4, 6000, 600);
  }, []);

  const b1Y = b1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const b1X = b1.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const b2Y = b2.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const b2X = b2.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const b3Y = b3.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const b3X = b3.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  const b4Y = b4.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const b4X = b4.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });

  const isVerified = user?.hostApplicationStatus === 'verified' || user?.role === 'host';
  const bg = isDark ? '#0D0B14' : '#F5F3FF';

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Aurora blobs */}
      <Animated.View pointerEvents="none" style={[styles.blob1, { transform: [{ translateY: b1Y }, { translateX: b1X }] }]} />
      <Animated.View pointerEvents="none" style={[styles.blob2, { transform: [{ translateY: b2Y }, { translateX: b2X }] }]} />
      <Animated.View pointerEvents="none" style={[styles.blob3, { transform: [{ translateY: b3Y }, { translateX: b3X }] }]} />
      <Animated.View pointerEvents="none" style={[styles.blob4, { transform: [{ translateY: b4Y }, { translateX: b4X }] }]} />

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HERO ── */}
        <View style={styles.hero}>
          {user
            ? <GlowAvatar user={user} isDark={isDark} />
            : (
              <View style={styles.guestAvatar}>
                <Ionicons name="person-outline" size={38} color="rgba(139,92,246,0.45)" />
              </View>
            )
          }

          <Text style={[styles.heroName, { color: colors.textPrimary }]}>
            {user ? user.name : 'Guest'}
          </Text>

          {user && (
            <Text style={[styles.heroEmail, { color: colors.textSecondary }]}>
              {user.email}
            </Text>
          )}

          <View style={[styles.pill, { backgroundColor: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)' }]}>
            <View style={[styles.pillDot, { backgroundColor: isVerified ? '#10B981' : '#8B5CF6' }]} />
            <Text style={[styles.pillText, { color: isVerified ? '#10B981' : '#8B5CF6' }]}>
              {user ? (isVerified ? 'Verified Host' : 'Member') : 'Not signed in'}
            </Text>
          </View>
        </View>

        {/* ── CARDS ── */}
        {user ? (
          <View style={styles.cards}>

            {/* Main actions */}
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Row
                icon={isVerified ? 'home-outline' : 'star-outline'}
                label={isVerified ? 'Host Dashboard' : 'Become a Host'}
                desc={isVerified ? 'Manage your listings' : 'List your property & earn'}
                iconColor={colors.primary} iconBg={colors.iconBgPrimary}
                onPress={() => router.push(isVerified ? '/host' : '/host/become-host')}
                colors={colors}
              />
              <Row
                icon="notifications-outline" label="Notifications"
                desc="View messages from hosts"
                iconColor={colors.accent} iconBg={colors.iconBgAccent}
                onPress={() => router.push('/profile/notifications')}
                colors={colors}
              />
              <Row
                icon="person-outline" label="Edit Profile"
                iconColor={colors.primary} iconBg={colors.iconBgPrimary}
                onPress={() => router.push('/profile/edit')}
                colors={colors}
              />
              <Row
                icon="heart-outline" label="Liked Properties"
                iconColor="#EC4899" iconBg={colors.iconBgPink}
                onPress={() => router.push('/profile/liked')}
                last
                colors={colors}
              />
            </View>

            {/* ── THEME ROW (full width) ── */}
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, styles.themeCard]}>
              <Text style={[styles.miniLabel, { color: colors.textLight }]}>THEME</Text>
              <ThemeToggle colors={colors} />
            </View>

            {/* ── SUPPORT CARD (full width) ── */}
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <Row
                icon="help-circle-outline" label="Support"
                iconColor={colors.secondary} iconBg={colors.iconBgSuccess}
                onPress={() => router.push('/profile/help')}
                colors={colors}
              />
              <Row
                icon="document-text-outline" label="Terms & Conditions"
                iconColor={colors.primary} iconBg={colors.iconBgPrimary}
                onPress={() => router.push('/terms')}
                colors={colors}
              />
              <Row
                icon="shield-checkmark-outline" label="Privacy Policy"
                iconColor={colors.primaryDark} iconBg={colors.iconBgPrimary}
                onPress={() => router.push('/privacy')}
                colors={colors}
              />
              <Row
                icon="business-outline" label="Host Policy"
                iconColor={colors.accent} iconBg={colors.iconBgAccent}
                onPress={() => router.push('/host-policy')}
                last
                colors={colors}
              />
            </View>

          </View>
        ) : (
          <View style={styles.cards}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.85} style={styles.signInCard}>
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInGrad}>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.signInText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SIGN OUT ── */}
        {user && (
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={17} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Aurora
  blob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    top: -110, right: -50, backgroundColor: 'rgba(139,92,246,0.2)',
  },
  blob2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    top: -30, left: -70, backgroundColor: 'rgba(236,72,153,0.11)',
  },
  blob3: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    top: -60, left: 80, backgroundColor: 'rgba(20,184,166,0.15)',
  },
  blob4: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    bottom: -20, right: -60, backgroundColor: 'rgba(99,102,241,0.15)',
  },

  page: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 28,
    gap: 8,
  },

  // Hero
  hero: { alignItems: 'center', paddingTop: 0, paddingBottom: 4 },
  heroName: { fontSize: 21, fontWeight: '800', letterSpacing: -0.6, marginTop: 8 },
  heroEmail: { fontSize: 13, marginTop: 3, letterSpacing: 0.1 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 5, borderRadius: 20, marginTop: 12,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Avatar
  avatarShell: {
    width: AVATAR_SIZE + 32, height: AVATAR_SIZE + 32,
    justifyContent: 'center', alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: AVATAR_SIZE + 10, height: AVATAR_SIZE + 10,
    borderRadius: (AVATAR_SIZE + 10) / 2, borderWidth: 2,
  },
  avatarDisc: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  verifiedBadge: {
    position: 'absolute', bottom: 5, right: 5,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  guestAvatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(139,92,246,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Cards
  cards: { gap: 8, marginVertical: 8 },
  card: {
    borderRadius: 18, paddingVertical: 4, paddingHorizontal: 2,
    borderWidth: 0.5, overflow: 'hidden',
  },
  cardLight: { backgroundColor: 'rgba(255,255,255,0.78)', borderColor: 'rgba(139,92,246,0.13)' },
  cardDark:  { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(196,181,253,0.1)' },

  // Theme card — compact horizontal layout
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, gap: 11 },
  rowIcon: { width: 33, height: 33, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowLabel: { fontSize: 14.5, fontWeight: '600' },
  rowDesc: { fontSize: 11, marginTop: 1 },
  sep: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },

  // Half card extras
  miniLabel: {
    fontSize: 9.5, fontWeight: '700', letterSpacing: 0.9,
  },

  // Theme toggle
  toggleTrack: { flex: 1, flexDirection: 'row', borderRadius: 10, padding: 3, gap: 2 },
  toggleOpt: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  toggleOptActive: { backgroundColor: '#8B5CF6' },

  // Sign in (guest)
  signInCard: { borderRadius: 18, overflow: 'hidden' },
  signInGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 16, gap: 8,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.18)',
    marginTop: 4,
  },
  signOutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});