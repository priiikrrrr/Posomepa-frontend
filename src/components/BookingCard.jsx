import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { FadeIn } from './Animations';
import { colors, spacing, borderRadius, shadows, gradients } from '../utils/theme';
import { uiTheme, cardTheme } from '../utils/appTheme';

const statusConfig = {
  requested: { color: colors.warning, bgColor: colors.warningLight, label: 'Requested', icon: 'time-outline', gradientColors: ['#FEF3C7', '#FDE68A'] },
  confirmed: { color: colors.success, bgColor: colors.successLight, label: 'Confirmed', icon: 'checkmark-circle', gradientColors: ['#DCFCE7', '#BBF7D0'] },
  completed: { color: colors.info, bgColor: colors.infoLight, label: 'Completed', icon: 'flag', gradientColors: ['#DBEAFE', '#BFDBFE'] },
  cancelled: { color: colors.error, bgColor: colors.errorLight, label: 'Cancelled', icon: 'close-circle', gradientColors: ['#FEE2E2', '#FECACA'] },
};

const paymentStatusConfig = {
  pending: { color: colors.warning, bgColor: colors.warningLight, label: 'Pending', dot: '#F59E0B' },
  paid: { color: colors.success, bgColor: colors.successLight, label: 'Paid', dot: '#22C55E' },
  failed: { color: colors.error, bgColor: colors.errorLight, label: 'Failed', dot: '#EF4444' },
  refunded: { color: colors.gray500, bgColor: colors.gray100, label: 'Refunded', dot: '#6B7280' },
};

const BookingCard = ({ booking, onPress, isAdmin = false, isHost = false, animationDelay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const status = statusConfig[booking.status] || statusConfig.requested;
  const paymentStatus = paymentStatusConfig[booking.paymentStatus] || paymentStatusConfig.pending;

  const showUserInfo = isAdmin || isHost;

  const isPropertyDeleted = booking.propertyDeleted;
  const propertyTitle = isPropertyDeleted ? booking.propertyTitle : booking.space?.title;
  const propertyCity = isPropertyDeleted ? booking.propertyLocation : booking.space?.location?.city;
  const propertyImage = isPropertyDeleted
    ? 'https://placehold.co/400x200/8B5CF6/ffffff?text=N'
    : booking.space?.images?.[0] || 'https://placehold.co/400x200/8B5CF6/ffffff?text=N';

  // Pulse for 'requested' status
  useEffect(() => {
    if (booking.status === 'requested') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [booking.status]);

  // Shimmer on mount
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, tension: 300, friction: 20 }),
      Animated.timing(elevationAnim, { toValue: 1, duration: 120, useNativeDriver: false }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }),
      Animated.timing(elevationAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const cardBorderColor = elevationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139,92,246,0.12)', 'rgba(139,92,246,0.4)'],
  });

  return (
    <FadeIn delay={animationDelay} duration={400}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.cardBorder, { borderColor: cardBorderColor }]}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.card}
            activeOpacity={1}
          >
            {/* ── Image Section ── */}
            <View style={styles.imageSection}>
              <Image source={{ uri: propertyImage }} style={styles.image} />

              {/* Rich gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(15,5,40,0.1)', 'rgba(15,5,40,0.72)']}
                locations={[0, 0.35, 1]}
                style={styles.imageOverlay}
              />
              <LinearGradient
                colors={['rgba(15,5,40,0.3)', 'transparent']}
                style={styles.imageTopFade}
              />

              {/* Status Badge */}
              <LinearGradient
                colors={status.gradientColors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.statusBadge}
              >
                <Animated.View style={booking.status === 'requested' ? { transform: [{ scale: pulseAnim }] } : {}}>
                  <Ionicons name={status.icon} size={13} color={status.color} />
                </Animated.View>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </LinearGradient>

              {/* Deleted badge */}
              {isPropertyDeleted && (
                <View style={styles.deletedBadge}>
                  <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.deletedGradient}>
                    <Ionicons name="alert-circle" size={12} color={colors.white} />
                    <Text style={styles.deletedText}>Deleted</Text>
                  </LinearGradient>
                </View>
              )}

              {/* Bottom info overlay */}
              <View style={styles.imageBottomInfo}>
                <Text style={styles.imageTitleOverlay} numberOfLines={1}>{propertyTitle}</Text>
                {propertyCity && (
                  <View style={styles.imageCityRow}>
                    <View style={styles.imageCityDot} />
                    <Text style={styles.imageCityText}>{propertyCity}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Content Section ── */}
            <View style={styles.content}>

              {/* Price + payment */}
              <View style={styles.pricePaymentRow}>
                <View style={styles.amountWrapper}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.price}>₹{booking.amount}</Text>
                </View>
                <View style={[styles.paymentBadge, { backgroundColor: paymentStatus.bgColor }]}>
                  <View style={[styles.paymentDot, { backgroundColor: paymentStatus.dot }]} />
                  <Text style={[styles.paymentText, { color: paymentStatus.color }]}>
                    {paymentStatus.label}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.dividerWrapper}>
                <View style={styles.divider} />
                <Animated.View style={[styles.dividerAccent, {
                  opacity: shimmerAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
                  transform: [{ scaleX: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] }) }],
                }]} />
              </View>

              {/* Date & Time cards */}
              <View style={styles.dateTimeGrid}>
                <View style={styles.dateTimeCard}>
                  <View style={[styles.dateTimeIcon, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                    <Ionicons name="calendar" size={14} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.dateTimeLabel}>Date</Text>
                    <Text style={styles.dateTimeValue}>
                      {format(new Date(booking.date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>
                <View style={styles.dateTimeCard}>
                  <View style={[styles.dateTimeIcon, { backgroundColor: 'rgba(13,148,136,0.1)' }]}>
                    <Ionicons name="time" size={14} color={colors.secondary} />
                  </View>
                  <View>
                    <Text style={styles.dateTimeLabel}>Time</Text>
                    <Text style={styles.dateTimeValue}>{booking.startTime} – {booking.endTime}</Text>
                  </View>
                </View>
              </View>

              {/* User info (admin/host) */}
              {showUserInfo && booking.user && (
                <View style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <LinearGradient colors={['#A78BFA', '#8B5CF6']} style={styles.userAvatarGradient}>
                      <Text style={styles.userInitial}>{booking.user.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{booking.user.name}</Text>
                    {isHost && booking.user?.phone && (
                      <View style={styles.phoneRow}>
                        <Ionicons name="call" size={11} color={colors.success} />
                        <Text style={styles.phoneText}>{booking.user.phone}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.userBadge}>
                    <Text style={styles.userBadgeText}>{isAdmin ? 'User' : 'Guest'}</Text>
                  </View>
                </View>
              )}

              {/* Notes */}
              {booking.notes && (
                <View style={styles.notesCard}>
                  <Ionicons name="document-text" size={13} color={colors.warning} />
                  <Text style={styles.notesText} numberOfLines={2}>{booking.notes}</Text>
                </View>
              )}

              {/* Booking ID */}
              <View style={styles.idRow}>
                <View style={styles.idBadge}>
                  <Text style={styles.idLabel}># </Text>
                  <Text style={styles.idValue} numberOfLines={1}>{booking._id}</Text>
                </View>
                <Ionicons name="copy-outline" size={12} color={colors.textLight} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </FadeIn>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.lg + 4,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardBorder: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  imageSection: {
    height: 115,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '100%',
  },
  imageTopFade: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 55,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  deletedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  deletedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    gap: 4,
  },
  deletedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  imageBottomInfo: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.md,
    right: spacing.md,
  },
  imageTitleOverlay: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  imageCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  imageCityDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#14B8A6',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  imageCityText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md + 2,
  },
  pricePaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  amountWrapper: {},
  amountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.6,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  paymentDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dividerWrapper: { marginBottom: spacing.md, position: 'relative', height: 1 },
  divider: { height: 1, backgroundColor: 'rgba(139,92,246,0.1)', position: 'absolute', left: 0, right: 0 },
  dividerAccent: {
    position: 'absolute',
    left: 0, right: 0, height: 1.5,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  dateTimeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateTimeIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  dateTimeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dateTimeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: 'rgba(139,92,246,0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.1)',
    marginBottom: spacing.sm,
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  userAvatarGradient: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  userInitial: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  phoneText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
  },
  userBadge: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  userBadgeText: {
    fontSize: 10, fontWeight: '700',
    color: colors.primary, letterSpacing: 0.4,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  notesText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    flex: 1, marginRight: spacing.sm,
  },
  idLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  idValue: {
    fontSize: 11,
    color: colors.textLight,
    flex: 1,
  },
});

export default BookingCard;