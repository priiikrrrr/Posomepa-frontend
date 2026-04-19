import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Platform, SafeAreaView, Alert, Animated, Easing, LayoutAnimation, UIManager, FlatList, StatusBar, Dimensions, ImageBackground, AsyncStorage } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, spacesAPI, recommendationsAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import SpaceCard from '../../src/components/SpaceCard';
import CategoryChip from '../../src/components/CategoryChip';
import { spacing, borderRadius, shadows } from '../../src/utils/theme';
import { useThemeColors } from '../../src/utils/theme';
import { headerGradients } from '../../src/utils/appTheme';

const LIKED_STORAGE_KEY = '@liked_spaces';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

const getHeaderTheme = (isDark) => isDark ? headerGradients.home.dark : headerGradients.home.light;
const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

/* ─── Stat Badge ─── */
function StatBadge({ icon, label, value, accent }) {
  const labelLength = label.length;
  let paddingH = 8;
  if (labelLength > 12) paddingH = 14;
  else if (labelLength > 8) paddingH = 12;
  else if (labelLength > 5) paddingH = 10;
  
  return (
    <View style={[statStyles.badge, { borderColor: accent + '30', paddingHorizontal: paddingH }]}>
      <LinearGradient colors={[accent + '18', accent + '06']} style={statStyles.badgeBg} />
      <Ionicons name={icon} size={15} color={accent} />
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 20, borderWidth: 1, overflow: 'hidden', flex: 1, justifyContent: 'center' },
  badgeBg: { ...StyleSheet.absoluteFillObject },
  value: { fontSize: 12, fontWeight: '800', letterSpacing: -0.3 },
  label: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
});

/* ─── Premium Perk Banner ─── */
const PERKS = [
  { icon: 'shield-checkmark', text: 'Verified Hosts', sub: 'Identity checked ✅' },
  { icon: 'flash', text: 'Instant Booking', sub: 'Skip the wait ⚡' },
  { icon: 'refresh-circle', text: 'Flexible Plans', sub: 'Reschedule easily 🔄' },
  { icon: 'headset', text: '24/7 Support', sub: 'We are always here 🎧' },
  { icon: 'pricetag', text: 'Best Pricing', sub: 'No hidden charges 💰' },
  { icon: 'star', text: 'Quality Spaces', sub: 'Curated for you ⭐' },
];

function QuoteBanner({ colors, isDark }) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -8, duration: 220, useNativeDriver: true }),
        Animated.timing(iconFade, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setIndex(prev => (prev + 1) % PERKS.length);
        slideAnim.setValue(10);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.timing(iconFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        ]).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const perk = PERKS[index];

  return (
    <View style={qbStyles.wrapper}>
      <LinearGradient
        colors={isDark ? ['#1a0533', '#2d1060', '#1a0533'] : ['#ede9fe', '#ddd6fe', '#ede9fe']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[qbStyles.glowBlob, { opacity: isDark ? 1 : 0.4 }]} />
      <View style={[qbStyles.glowBlob2, { opacity: isDark ? 1 : 0.3 }]} />

      <View style={qbStyles.topRow}>
        <View style={[qbStyles.brandBadge, { backgroundColor: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.15)', borderColor: isDark ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.25)' }]}>
          <Text style={[qbStyles.brandText, { color: isDark ? '#c4b5fd' : '#7c3aed' }]}>PosomePa</Text>
        </View>
        <View style={qbStyles.dotsRow}>
          {PERKS.map((_, i) => (
            <View
              key={i}
              style={[
                qbStyles.dot,
                i === index && qbStyles.dotActive,
                i === index && { backgroundColor: isDark ? '#a78bfa' : '#7c3aed' },
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }
              ]}
            />
          ))}
        </View>
      </View>

      <View style={qbStyles.mainRow}>
        <Animated.View style={[qbStyles.iconBox, { opacity: iconFade, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.1)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(139,92,246,0.2)' }]}>
          <Ionicons name={perk.icon} size={22} color={isDark ? '#c4b5fd' : '#7c3aed'} />
        </Animated.View>

        <Animated.View
          style={[
            qbStyles.textArea,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[qbStyles.perkTitle, { color: isDark ? '#f5f3ff' : '#1e0a4a' }]} numberOfLines={1}>{perk.text}</Text>
          <Text style={[qbStyles.perkSub, { color: isDark ? 'rgba(196,181,253,0.75)' : 'rgba(124,58,237,0.8)' }]} numberOfLines={1}>{perk.sub}</Text>
        </Animated.View>

        <View style={[qbStyles.arrowBox, { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)', borderColor: isDark ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.25)' }]}>
          <Ionicons name="arrow-forward" size={14} color={isDark ? '#a78bfa' : '#7c3aed'} />
        </View>
      </View>

      <View style={[qbStyles.strip, { borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(139,92,246,0.1)' }]}>
        {['Verified', 'Instant Book', 'Free Cancel'].map((t, i) => (
          <View key={i} style={qbStyles.stripItem}>
            <View style={[qbStyles.stripDot, { backgroundColor: isDark ? '#7c3aed' : '#8b5cf6' }]} />
            <Text style={[qbStyles.stripText, { color: isDark ? 'rgba(196,181,253,0.6)' : 'rgba(124,58,237,0.7)' }]}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const qbStyles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    paddingBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
  },
  glowBlob: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    top: -70, right: -50,
    backgroundColor: 'rgba(139,92,246,0.35)',
  },
  glowBlob2: {
    position: 'absolute',
    width: 110, height: 110, borderRadius: 55,
    bottom: -40, left: 10,
    backgroundColor: 'rgba(236,72,153,0.2)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dotsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotActive: { width: 18, borderRadius: 2 },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 46, height: 46, borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  textArea: { flex: 1 },
  perkTitle: {
    fontSize: 16, fontWeight: '800', letterSpacing: -0.4, lineHeight: 20,
  },
  perkSub: {
    fontSize: 12,
    marginTop: 3, fontWeight: '500',
  },
  arrowBox: {
    width: 32, height: 32, borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  strip: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stripDot: { width: 4, height: 4, borderRadius: 2 },
  stripText: { fontSize: 10, fontWeight: '600' },
});

/* ─── Premium Feature Card (horizontal scroll) ─── */
function FeatureCard({ space, onPress, index, colors }) {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay: index * 120, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
  }, []);

  useEffect(() => {
    const checkLiked = async () => {
      try {
        const stored = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
        if (stored) {
          const likedIds = JSON.parse(stored);
          setIsLiked(likedIds.includes(space._id));
        }
      } catch (e) { console.log('Error checking like:', e); }
    };
    checkLiked();
  }, [space._id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    try {
      const stored = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
      let likedIds = stored ? JSON.parse(stored) : [];
      if (newLiked) {
        if (!likedIds.includes(space._id)) likedIds.push(space._id);
      } else {
        likedIds = likedIds.filter(id => id !== space._id);
      }
      await AsyncStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedIds));
    } catch (e) { console.log('Error toggling like:', e); }

    Animated.sequence([
      Animated.spring(likeScaleAnim, { toValue: 1.5, useNativeDriver: true, tension: 120, friction: 3 }),
      Animated.spring(likeScaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 120, friction: 5 }),
      Animated.spring(likeScaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
  };

  const accentColors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
  const accent = accentColors[index % accentColors.length];

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[fcStyles.card, { width: CARD_WIDTH }]}>
        <View style={fcStyles.imageBox}>
          {space.images?.[0] ? (
            <ImageBackground source={{ uri: space.images[0] }} style={fcStyles.image} imageStyle={{ borderRadius: 20 }}>
              <LinearGradient colors={['transparent', 'rgba(10,6,30,0.82)']} style={fcStyles.imgOverlay} />
            </ImageBackground>
          ) : (
            <LinearGradient colors={[accent + '40', accent + '10']} style={[fcStyles.image, { borderRadius: 20, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="home" size={40} color={accent} />
            </LinearGradient>
          )}
          <TouchableOpacity onPress={handleLike} style={fcStyles.likeButton} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: likeScaleAnim }] }}>
              <View style={[fcStyles.likeRing, isLiked && fcStyles.likeRingActive]}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? '#EF4444' : '#fff'} />
              </View>
            </Animated.View>
          </TouchableOpacity>
          <View style={fcStyles.imgContent}>
            <View style={[fcStyles.typePill, { backgroundColor: accent + 'CC' }]}>
              <Text style={fcStyles.typeText}>{space.category || 'Space'}</Text>
            </View>
            <Text style={fcStyles.cardName} numberOfLines={2}>{space.name}</Text>
            <View style={fcStyles.cardMeta}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={fcStyles.metaText}>{space.location?.city || 'Prime Location'}</Text>
              <View style={fcStyles.ratingBadge}>
                <Ionicons name="star" size={10} color="#F59E0B" />
                <Text style={fcStyles.ratingText}>{space.rating?.toFixed(1) || '4.8'}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={fcStyles.priceBadge}>
          <Text style={fcStyles.priceLabel}>from</Text>
          <Text style={fcStyles.priceValue}>₹{space.pricePerHour || space.price || '—'}</Text>
          <Text style={fcStyles.priceUnit}>/hr</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const fcStyles = StyleSheet.create({
  card: { marginRight: 16, position: 'relative' },
  imageBox: { borderRadius: 20, overflow: 'hidden', height: 220 },
  image: { width: '100%', height: '100%' },
  imgOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  likeButton: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  likeRing: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  likeRingActive: { borderWidth: 2, borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.2)' },
  imgContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 6 },
  typeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  cardName: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.4, lineHeight: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  ratingText: { color: '#F59E0B', fontSize: 10, fontWeight: '700' },
  priceBadge: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'baseline', gap: 2, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  priceLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '500' },
  priceValue: { fontSize: 15, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  priceUnit: { fontSize: 9, color: '#94A3B8', fontWeight: '500' },
});

/* ─── Compact Grid Space Card ─── */
function GridSpaceCard({ space, onPress, colors }) {
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLiked = async () => {
      try {
        const stored = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
        if (stored) {
          const likedIds = JSON.parse(stored);
          setIsLiked(likedIds.includes(space._id));
        }
      } catch (e) { console.log('Error checking like:', e); }
    };
    checkLiked();
  }, [space._id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    try {
      const stored = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
      let likedIds = stored ? JSON.parse(stored) : [];
      if (newLiked) {
        if (!likedIds.includes(space._id)) likedIds.push(space._id);
      } else {
        likedIds = likedIds.filter(id => id !== space._id);
      }
      await AsyncStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedIds));
    } catch (e) { console.log('Error toggling like:', e); }

    Animated.sequence([
      Animated.spring(likeScaleAnim, { toValue: 1.5, useNativeDriver: true, tension: 120, friction: 3 }),
      Animated.spring(likeScaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 120, friction: 5 }),
      Animated.spring(likeScaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[gsStyles.card, isLiked && gsStyles.cardLiked, { backgroundColor: colors.surface }]}>
      <View style={gsStyles.imageBox}>
        {space.images?.[0] ? (
          <ImageBackground source={{ uri: space.images[0] }} style={gsStyles.image} imageStyle={{ borderRadius: 14 }}>
            <LinearGradient colors={['transparent', 'rgba(10,6,30,0.7)']} style={gsStyles.overlay} />
          </ImageBackground>
        ) : (
          <LinearGradient colors={[colors.primary + '20', colors.primary + '10']} style={[gsStyles.image, { borderRadius: 14, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="home-outline" size={28} color={colors.primary} />
          </LinearGradient>
        )}
        <View style={gsStyles.ratingBubble}>
          <Ionicons name="star" size={9} color="#F59E0B" />
          <Text style={gsStyles.ratingTxt}>{space.rating?.toFixed(1) || '4.8'}</Text>
        </View>
        <TouchableOpacity onPress={handleLike} style={gsStyles.likeButton} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale: likeScaleAnim }] }}>
            <View style={[gsStyles.likeRing, isLiked && gsStyles.likeRingActive]}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={16} color={isLiked ? '#EF4444' : '#fff'} />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
      <View style={gsStyles.info}>
        <Text style={[gsStyles.name, { color: colors.textPrimary }]} numberOfLines={1}>{space.name}</Text>
        <Text style={[gsStyles.loc, { color: colors.textLight }]} numberOfLines={1}>{space.location?.city || 'Premium'}</Text>
        <View style={gsStyles.priceRow}>
          <Text style={[gsStyles.price, { color: colors.primary }]}>₹{space.pricePerHour || space.price || '—'}</Text>
          <Text style={[gsStyles.unit, { color: colors.textLight }]}>/hr</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const gsStyles = StyleSheet.create({
  card: { width: (SCREEN_WIDTH - 48) / 2, marginBottom: 16, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#8B5CF6', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4, overflow: 'hidden' },
  cardLiked: { borderWidth: 2, borderColor: 'rgba(239,68,68,0.4)' },
  imageBox: { borderRadius: 14, overflow: 'hidden', height: 130, margin: 6 },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  likeButton: { position: 'absolute', bottom: 8, right: 8, zIndex: 10 },
  likeRing: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  likeRingActive: { borderWidth: 2, borderColor: 'rgba(239,68,68,0.6)', backgroundColor: 'rgba(239,68,68,0.25)' },
  ratingBubble: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 3 },
  ratingTxt: { color: '#F59E0B', fontSize: 9, fontWeight: '700' },
  info: { paddingHorizontal: 10, paddingBottom: 12, paddingTop: 4 },
  name: { fontSize: 13, fontWeight: '700', color: '#1E293B', letterSpacing: -0.2 },
  loc: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 1 },
  price: { fontSize: 15, fontWeight: '800', color: '#8B5CF6', letterSpacing: -0.5 },
  unit: { fontSize: 10, color: '#94A3B8' },
});

/* ─── Category Pill (premium) ─── */
function PremiumCategoryChip({ category, selected, onPress, colors }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[pcStyles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceSecondary }, selected && pcStyles.chipSelected]}>
      <Ionicons name={category.icon || 'apps-outline'} size={13} color={selected ? '#fff' : (category.color || colors.primary)} />
      <Text style={[pcStyles.text, { color: selected ? '#fff' : colors.textSecondary }]}>{category.name}</Text>
    </TouchableOpacity>
  );
}
const pcStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, marginRight: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  chipSelected: { borderColor: '#8B5CF620' },
  text: { fontSize: 13, fontWeight: '600' },
});

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle, action, onAction, colors }) {
  return (
    <View style={shStyles.row}>
      <View>
        <Text style={[shStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[shStyles.sub, { color: colors.textLight }]}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <TouchableOpacity onPress={onAction} style={shStyles.actionBtn}>
          <Text style={[shStyles.actionText, { color: colors.primary }]}>{action}</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 12, marginTop: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: 12, fontWeight: '600' },
});

/* ─── Main Screen ─── */
export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridPageIndex, setGridPageIndex] = useState(0);
  const gridPageWidth = SCREEN_WIDTH - 32;

  const currentHeaderTheme = getHeaderTheme(isDark) || headerGradients.home.light;

  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const streak = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [selectedCategory]);

  useEffect(() => {
    const roundTrip = (anim, duration, delay = 0) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));

    const pulseAnim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));

    const streakAnim = Animated.loop(Animated.sequence([
      Animated.timing(streak, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(streak, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(2000),
    ]));

    [roundTrip(wave1, 4000, 0), roundTrip(wave2, 5000, 500), roundTrip(wave3, 6000, 1000)].forEach(a => a.start());
    pulseAnim.start();
    streakAnim.start();

    return () => {
      [wave1, wave2, wave3, pulse, streak].forEach(a => a.stopAnimation());
    };
  }, []);

  const b1Y = wave1.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });
  const b1X = wave1.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const b2Y = wave2.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const b2X = wave2.interpolate({ inputRange: [0, 1], outputRange: [15, -15] });
  const b3Y = wave3.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
  const b3X = wave3.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const streakX = streak.interpolate({ inputRange: [0, 1], outputRange: [-300, 500] });
  const streakY = streak.interpolate({ inputRange: [0, 1], outputRange: [-80, 160] });
  const streakOpacity = streak.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.7, 0.7, 0] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data),
    retry: 2, staleTime: 5 * 60 * 1000,
  });

  const defaultCategories = [
    { _id: '1', name: 'Apartments', icon: 'home-outline', color: '#8B5CF6' },
    { _id: '2', name: 'Villas', icon: 'home', color: '#EC4899' },
    { _id: '3', name: 'Rooftops', icon: 'sunny-outline', color: '#F59E0B' },
    { _id: '4', name: 'Farmhouses', icon: 'leaf-outline', color: '#10B981' },
    { _id: '5', name: 'Coworking', icon: 'laptop-outline', color: '#3B82F6' },
    { _id: '6', name: 'Banquet Halls', icon: 'gift-outline', color: '#EF4444' },
    { _id: '7', name: 'Party Halls', icon: 'happy-outline', color: '#DB2777' },
    { _id: '8', name: 'Gyms', icon: 'fitness-outline', color: '#F43F5E' },
  ];

  const categories = categoriesData?.categories
    ? categoriesData.categories
    : (Array.isArray(categoriesData) ? categoriesData : defaultCategories);

  const { data: spacesData, refetch } = useQuery({
    queryKey: ['spaces', selectedCategory?.name || 'all'],
    queryFn: async () => {
      const params = {};
      if (selectedCategory?.name) params.category = selectedCategory.name;
      return spacesAPI.getAll({ ...params, limit: 100 }).then(res => res.data);
    },
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured'],
    queryFn: () => spacesAPI.getAll({ featured: true, limit: 50 }).then(res => res.data),
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: () => {
      if (!user) return Promise.resolve({ spaces: [] });
      return recommendationsAPI.getHybrid(10).then(res => res.data);
    },
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const spaces = spacesData?.spaces || [];
  const featuredSpaces = recommendationsData?.spaces?.length > 0
    ? recommendationsData.spaces
    : (featuredData?.spaces || []);
  const showForYou = user && recommendationsData?.spaces?.length > 0;

  const COLS = 4;
  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  };
  const categoryPages = chunkArray(categories, 8);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <LinearGradient colors={currentHeaderTheme.gradient} style={styles.headerGradient} />
        <Animated.View style={[styles.auroraBlob1, { transform: [{ translateY: b1Y }, { translateX: b1X }] }]} />
        <Animated.View style={[styles.auroraBlob2, { transform: [{ translateY: b2Y }, { translateX: b2X }] }]} />
        <Animated.View style={[styles.auroraBlob3, { transform: [{ translateY: b3Y }, { translateX: b3X }] }]} />
        <Animated.View style={[styles.lightStreak, { transform: [{ translateX: streakX }, { translateY: streakY }, { rotate: '-30deg' }], opacity: streakOpacity }]} />
        <LinearGradient colors={['transparent', colors.background]} locations={[0.55, 1]} style={styles.headerBottomFade} pointerEvents="none" />
        <View style={styles.headerContent}>
          <View style={styles.nameBlock}>
            <Text style={[styles.headerGreeting, { color: currentHeaderTheme.greetingColor }]}>Good {getTimeOfDay()} <Text style={styles.sparkle}>✦</Text></Text>
            <Animated.Text style={[styles.headerName, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} numberOfLines={1}>
              {user ? user.name : 'Guest'}
            </Animated.Text>
            {user?.hostApplicationStatus === 'verified' ? (
              <View style={[styles.locationPill, { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.locationText, { color: '#1E0A4A' }]}>Verified Host</Text>
              </View>
            ) : (
              <View style={[styles.locationPill, { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                <View style={[styles.locationDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.locationText, { color: '#1E0A4A' }]}>PosomePa</Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={user ? handleLogout : () => router.push('/(auth)/login')} style={styles.glassButton}>
              <Ionicons name={user ? 'log-out-outline' : 'log-in-outline'} size={18} color={currentHeaderTheme.iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        <View style={{ paddingHorizontal: 16, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="home-outline" size={13} color={colors.primary} />
          <Text style={{ color: colors.textLight, fontSize: 12, fontWeight: '500' }}>
            {spaces.length > 0 ? `${spaces.length} spaces available` : 'Discovering spaces near you...'}
          </Text>
        </View>

        <QuoteBanner colors={colors} isDark={isDark} />

        <View style={styles.section}>
          <SectionHeader title="Explore" subtitle="What are you looking for?" colors={colors} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            <PremiumCategoryChip
              category={{ name: 'All', icon: 'apps-outline' }}
              selected={!selectedCategory}
              onPress={() => {
                if (selectedCategory) {
                  setSelectedCategory(null);
                } else {
                  setShowGrid(!showGrid);
                }
              }}
              colors={colors}
            />
            {categories.map((cat) => (
              <PremiumCategoryChip
                key={cat._id}
                category={cat}
                selected={selectedCategory?._id === cat._id}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowGrid(false);
                }}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>

        {showGrid && categories.length > 0 && (
          <View style={[styles.categoryGridOuter, { backgroundColor: colors.surface }]}>
            <FlatList
              data={categoryPages}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={gridPageWidth}
              snapToAlignment="start"
              onScroll={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / gridPageWidth);
                setGridPageIndex(idx);
              }}
              scrollEventThrottle={16}
              getItemLayout={(_, index) => ({ length: gridPageWidth, offset: gridPageWidth * index, index })}
              renderItem={({ item: page }) => {
                const rows = chunkArray(page, COLS);
                return (
                  <View style={[styles.categoryPage, { width: gridPageWidth }]}>
                    {rows.map((row, rowIdx) => (
                      <View key={rowIdx} style={styles.categoryGridRow}>
                        {row.map((cat) => (
                          <TouchableOpacity
                            key={cat._id}
                            style={[styles.gridItem, { borderColor: (cat.color || colors.primary) + '30' }]}
                            onPress={() => { setSelectedCategory(cat); setShowGrid(false); }}
                          >
                            <View style={[styles.gridIcon, { backgroundColor: (cat.color || colors.primary) + '18' }]}>
                              <Ionicons name={cat.icon || 'apps-outline'} size={20} color={cat.color || colors.primary} />
                            </View>
                            <Text style={[styles.gridLabel, { color: colors.textPrimary }]} numberOfLines={2}>{cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                        {row.length < COLS && Array(COLS - row.length).fill(null).map((_, i) => (
                          <View key={`empty-${i}`} style={[styles.gridItem, { borderColor: 'transparent', backgroundColor: 'transparent' }]} />
                        ))}
                      </View>
                    ))}
                  </View>
                );
              }}
            />
            {categoryPages.length > 1 && (
              <View style={styles.pageDots}>
                {categoryPages.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pageDot,
                      { backgroundColor: i === gridPageIndex ? colors.primary : colors.primary + '35',
                        width: i === gridPageIndex ? 16 : 5 }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {(showForYou || featuredSpaces.length > 0) && (
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <View style={{ paddingHorizontal: 16 }}>
              <SectionHeader
                title={showForYou ? 'For You' : 'Featured'}
                subtitle={showForYou ? 'Picked based on your taste' : 'Handpicked premium spaces'}
                action="See all"
                onAction={() => router.push('/spaces')}
                colors={colors}
              />
            </View>
            <FlatList
              data={featuredSpaces.slice(0, 8)}
              renderItem={({ item, index }) => (
                <FeatureCard
                  space={item}
                  index={index}
                  onPress={() => router.push(`/space/${item._id}`)}
                  colors={colors}
                />
              )}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
            />
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={[styles.section, { marginTop: 24 }]}>
          <SectionHeader
            title={selectedCategory ? `${selectedCategory.name} Spaces` : 'All Spaces'}
            subtitle={`${spaces.length} spaces available`}
            colors={colors}
          />
          {spaces.length > 0 ? (
            <View style={styles.spacesGrid}>
              {spaces.map((space) => (
                <GridSpaceCard
                  key={space._id}
                  space={space}
                  onPress={() => router.push(`/space/${space._id}`)}
                  colors={colors}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <View style={[styles.emptyIconRing, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="home-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No spaces found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textLight }]}>Be the first to list a property!</Text>
              {user?.hostApplicationStatus === 'verified' && (
                <TouchableOpacity style={[styles.listPropertyButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/admin/spaces')}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.white} />
                  <Text style={[styles.listPropertyText, { color: colors.white }]}>List Your Property</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { height: 200, position: 'relative', overflow: 'hidden' },
  headerGradient: { ...StyleSheet.absoluteFillObject },
  headerContent: { position: 'absolute', bottom: 24, left: 0, right: 0, paddingHorizontal: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerActions: { marginBottom: 8 },
  glassButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  nameBlock: { gap: 2 },
  headerGreeting: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8, textTransform: 'uppercase' },
  headerName: { fontSize: 27, fontWeight: '800', color: '#F5F3FF', letterSpacing: -0.8, textShadowColor: 'rgba(139, 92, 246, 0.55)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 },
  sparkle: { fontSize: 14 },
  locationPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8, gap: 6 },
  locationDot: { width: 6, height: 6, borderRadius: 3 },
  locationText: { fontSize: 12, fontWeight: '600' },
  auroraBlob1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -120, right: -50, backgroundColor: 'rgba(139, 92, 246, 0.3)' },
  auroraBlob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -30, left: -60, backgroundColor: 'rgba(13, 148, 136, 0.18)' },
  auroraBlob3: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: 10, left: '30%', backgroundColor: 'rgba(196, 181, 253, 0.38)' },
  lightStreak: { position: 'absolute', width: 80, height: 600, backgroundColor: 'rgba(167, 139, 250, 0.18)', top: -200, left: 0, borderRadius: 40 },
  headerBottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },

  scrollContent: { paddingBottom: 110 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  categoriesContainer: { flexDirection: 'row', paddingVertical: 4 },

  categoryGridOuter: { marginHorizontal: 16, marginTop: 10, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 0 },
  categoryGridScrollContent: { paddingHorizontal: 0 },
  categoryPage: { paddingHorizontal: 12 },
  categoryGridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  gridItem: { alignItems: 'center', padding: 8, borderRadius: 14, borderWidth: 1, width: (SCREEN_WIDTH - 56) / 4 },
  gridIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  gridLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pageDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 8, marginBottom: 4 },
  pageDot: { height: 5, borderRadius: 2.5 },

  spacesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  divider: { height: 1, marginHorizontal: 16, marginVertical: 4 },

  emptyState: { alignItems: 'center', padding: 40, borderRadius: 24, marginTop: 8 },
  emptyIconRing: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySubtext: { fontSize: 12, marginTop: 4 },
  listPropertyButton: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, gap: 6 },
  listPropertyText: { fontWeight: '700', fontSize: 13 },
});
