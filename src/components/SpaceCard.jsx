import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Dimensions, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FadeIn } from './Animations';
import { colors, spacing, borderRadius, shadows, gradients } from '../utils/theme';
import { uiTheme, cardTheme } from '../utils/appTheme';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const LIKED_STORAGE_KEY = '@liked_spaces';
const { width } = Dimensions.get('window');

const SpaceCard = ({ space, onPress, animationDelay = 0 }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [displayRating, setDisplayRating] = useState(space.rating || 0);
  const [showRating, setShowRating] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => { setDisplayRating(space.rating || 0); }, [space.rating]);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const ratingScaleAnim = useRef(new Animated.Value(1)).current;
  const toastSlideAnim = useRef(new Animated.Value(-100)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const priceAnim = useRef(new Animated.Value(1)).current;

  // Subtle shimmer on mount
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Glow pulse on liked
  useEffect(() => {
    if (isLiked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isLiked]);

  const showToast = (message, type = 'success') => {
    setToastMessage(message); setToastType(type); setToastVisible(true);
    toastSlideAnim.setValue(-100);
    Animated.spring(toastSlideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }).start();
    setTimeout(() => {
      Animated.timing(toastSlideAnim, { toValue: -100, duration: 200, useNativeDriver: true })
        .start(() => setToastVisible(false));
    }, 2500);
  };

  const showRatingPopup = () => { setTempRating(0); setShowRating(true); };
  const submitRating = (rating) => { setShowRating(false); ratingMutation.mutate({ rating }); };

  const ratingMutation = useMutation({
    mutationFn: ({ rating }) => reviewsAPI.add({ spaceId: space._id, rating, comment: '' }),
    onSuccess: (response) => {
      setDisplayRating(response.data.spaceRating);
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      showToast('Rating submitted!', 'success');
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to submit rating', 'error');
    },
  });

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

  const images = space.images?.length > 0
    ? space.images.map(img => img.url || img)
    : ['https://placehold.co/400x300/8B5CF6/ffffff?text=No+Image'];

  const formatPrice = (price) => `₹${price}`;
  const getPriceLabel = (priceType) => {
    switch (priceType) {
      case 'hourly': return '/hr';
      case 'daily': return '/day';
      case 'monthly': return '/mo';
      default: return '';
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
    Animated.spring(priceAnim, { toValue: 1.04, useNativeDriver: true, tension: 200, friction: 15 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
    Animated.spring(priceAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 15 }).start();
  };

  const handleLikePress = async () => {
    if (!user) { Alert.alert('Login Required', 'Please login to like properties'); return; }
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    try {
      const stored = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
      let likedIds = stored ? JSON.parse(stored) : [];
      if (newLiked) {
        if (!likedIds.includes(space._id)) likedIds.push(space._id);
        showToast('Added to favorites', 'success');
      } else {
        likedIds = likedIds.filter(id => id !== space._id);
        showToast('Removed from favorites', 'success');
      }
      await AsyncStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedIds));
    } catch (e) { showToast('Failed to update favorites', 'error'); }

    Animated.sequence([
      Animated.spring(likeScaleAnim, { toValue: 1.5, useNativeDriver: true, tension: 120, friction: 3 }),
      Animated.spring(likeScaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 120, friction: 5 }),
      Animated.spring(likeScaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
  };

  const RESTRICTIVE_KEYWORDS = ['Not Allowed', 'No ', 'Only', 'Max '];
  const isRestrictiveRule = (rule) => RESTRICTIVE_KEYWORDS.some(k => rule.includes(k));

  const renderAmenities = () => {
    const amenities = space.amenities?.slice(0, 3) || [];
    const moreCount = (space.amenities?.length || 0) - 3;
    return (
      <View style={styles.amenitiesContainer}>
        {amenities.map((amenity, idx) => (
          <View key={idx} style={styles.amenityChip}>
            <LinearGradient colors={['rgba(13,148,136,0.15)', 'rgba(13,148,136,0.05)']} style={styles.amenityGradient}>
              <Ionicons name="checkmark-circle" size={11} color={uiTheme.amenities.checkColor} />
              <Text style={styles.amenityText}>{amenity}</Text>
            </LinearGradient>
          </View>
        ))}
        {moreCount > 0 && (
          <View style={[styles.amenityChip]}>
            <View style={styles.amenityMore}>
              <Text style={styles.amenityTextMore}>+{moreCount} more</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderRules = () => {
    const rules = [...new Set(space.rules || [])].slice(0, 4);
    if (rules.length === 0) return null;
    return (
      <View style={styles.rulesContainer}>
        {rules.map((rule, idx) => {
          const isRestricted = isRestrictiveRule(rule);
          return (
            <View key={idx} style={[styles.ruleBadge, isRestricted ? styles.ruleBadgeRestricted : styles.ruleBadgeAllowed]}>
              <Ionicons
                name={isRestricted ? 'close-circle' : 'checkmark-circle'}
                size={11}
                color={isRestricted ? uiTheme.rules.restrictedText : uiTheme.rules.allowedText}
              />
              <Text style={[styles.ruleBadgeText, isRestricted && styles.ruleBadgeTextRestricted]}>
                {rule}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setCurrentImageIndex(viewableItems[0].index || 0);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const heartBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.8)'],
  });

  return (
    <>
      <FadeIn delay={animationDelay} duration={500}>
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
          {/* Outer glow ring when liked */}
          {isLiked && (
            <Animated.View style={[styles.likedGlowRing, { borderColor: heartBorderColor }]} />
          )}

          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.card}
            activeOpacity={1}
          >
            {/* ── Image carousel ── */}
            <View style={styles.imageContainer}>
              <FlatList
                data={images}
                horizontal pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                keyExtractor={(item, idx) => `${space._id}-img-${idx}`}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.carouselImage} />
                )}
              />

              {/* Multi-layer gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(30,10,74,0.08)', 'rgba(30,10,74,0.65)']}
                locations={[0, 0.45, 1]}
                style={styles.imageOverlay}
              />
              {/* Top fade for action buttons legibility */}
              <LinearGradient
                colors={['rgba(15,5,40,0.45)', 'transparent']}
                style={styles.imageTopFade}
              />

              {/* Dot indicators */}
              {images.length > 1 && (
                <View style={styles.indicatorContainer}>
                  {images.map((_, idx) => (
                    <Animated.View
                      key={idx}
                      style={[
                        styles.indicator,
                        currentImageIndex === idx && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Featured badge */}
              {space.featured && (
                <View style={styles.featuredBadge}>
                  <LinearGradient
                    colors={cardTheme.badge.featured}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.featuredGradient}
                  >
                    <Ionicons name="star" size={10} color={colors.white} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </LinearGradient>
                </View>
              )}

              {/* Category pill at bottom-left of image */}
              {space.category?.name && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{space.category.name}</Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actionButtonsContainer}>
                {/* Rating */}
                <Animated.View style={[styles.ratingBadge, { transform: [{ scale: ratingScaleAnim }] }]}>
                  <TouchableOpacity
                    style={styles.ratingTouchable}
                    onPress={() => {
                      if (!user) { Alert.alert('Login Required', 'Please login to rate properties'); return; }
                      showRatingPopup();
                    }}
                  >
                    <Ionicons name="star" size={13} color={uiTheme.rating.starColor} />
                  </TouchableOpacity>
                  <Text style={styles.ratingText}>{displayRating.toFixed(1)}</Text>
                </Animated.View>

                {/* Like */}
                <TouchableOpacity style={[styles.wishlistButton, isLiked && styles.wishlistButtonLiked]} onPress={handleLikePress} activeOpacity={1}>
                  <Animated.View style={{ transform: [{ scale: likeScaleAnim }] }}>
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={17}
                      color={uiTheme.like.heartColor}
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>

              {/* Rating popup */}
              {showRating && (
                <View style={styles.ratingPopupOverlay}>
                  <TouchableOpacity style={styles.ratingPopupBg} onPress={() => setShowRating(false)} />
                  <View style={styles.ratingPopup}>
                    <View style={styles.ratingPopupInner}>
                      <View style={styles.ratingStarIcon}>
                        <Ionicons name="star" size={16} color={uiTheme.rating.starColor} />
                      </View>
                      <Text style={styles.ratingPopupTitle}>How was your stay?</Text>
                      <View style={styles.ratingStarsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity 
                            key={star} 
                            onPress={() => { setTempRating(star); submitRating(star); }} 
                            style={styles.ratingStarBtn}
                          >
                            <Ionicons
                              name={tempRating >= star ? 'star' : 'star-outline'}
                              size={18}
                              color={tempRating >= star ? uiTheme.rating.starColor : 'rgba(139,92,246,0.25)'}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.ratingHint}>Tap to rate</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ── Content ── */}
            <View style={styles.content}>
              {/* Title row */}
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{space.title}</Text>
                {space.owner?.hostApplicationStatus === 'verified' && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                  </View>
                )}
              </View>

              {/* Location */}
              <View style={styles.locationRow}>
                <View style={styles.locationDot} />
                <Text style={styles.location}>{space.location?.city}</Text>
                {space.owner?.hostApplicationStatus === 'verified' && (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>Verified Host</Text>
                  </View>
                )}
              </View>

              {renderAmenities()}
              {renderRules()}

              {/* Divider with shimmer */}
              <View style={styles.dividerWrapper}>
                <View style={styles.divider} />
                <Animated.View style={[styles.dividerShimmer, {
                  opacity: shimmerAnim,
                  transform: [{ scaleX: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
                }]} />
              </View>

              {/* Price + Book */}
              <View style={styles.priceRow}>
                <Animated.View style={[styles.priceBlock, { transform: [{ scale: priceAnim }] }]}>
                  <Text style={styles.priceValue}>{formatPrice(space.price, space.priceType)}</Text>
                  <View style={styles.priceLabelPill}>
                    <Text style={styles.priceLabel}>{getPriceLabel(space.priceType)}</Text>
                  </View>
                </Animated.View>

                <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
                  <LinearGradient
                    colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.bookButton}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                    <View style={styles.bookArrow}>
                      <Ionicons name="arrow-forward" size={12} color="#8B5CF6" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </FadeIn>

      {/* Toast */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            toastType === 'error' ? styles.toastError : styles.toastSuccess,
            { transform: [{ translateY: toastSlideAnim }] },
          ]}
        >
          <View style={styles.toastIconWrapper}>
            <Ionicons
              name={toastType === 'error' ? 'close-circle' : 'checkmark-circle'}
              size={20}
              color={colors.white}
            />
          </View>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.xl + 4,
    borderRadius: borderRadius.xxl,
    ...shadows.lg,
  },
  likedGlowRing: {
    position: 'absolute',
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: borderRadius.xxl + 3,
    borderWidth: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
  },
  imageContainer: { height: 230, position: 'relative' },
  carouselImage: {
    width: width - spacing.xxl * 2,
    height: 230,
    backgroundColor: colors.gray100,
  },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
  },
  imageTopFade: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 70,
  },
  indicatorContainer: {
    position: 'absolute', bottom: spacing.md,
    left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  indicator: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 2.5,
  },
  indicatorActive: {
    backgroundColor: colors.white,
    width: 18, height: 5,
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  featuredBadge: { position: 'absolute', top: spacing.md, left: spacing.md },
  featuredGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: borderRadius.md, gap: 4,
  },
  featuredText: { color: colors.white, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  categoryPill: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backdropFilter: 'blur(10px)',
  },
  categoryPillText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  actionButtonsContainer: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    flexDirection: 'row', gap: 7,
  },
  ratingBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 9, paddingVertical: 6,
    borderRadius: borderRadius.md, gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  ratingTouchable: { padding: 1 },
  ratingText: { fontSize: 12, fontWeight: '800', color: colors.textPrimary },
  ratingPopupOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  ratingPopupBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  ratingPopup: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: 180,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  ratingPopupInner: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  ratingStarIcon: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ratingPopupTitle: {
    fontSize: 13, fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.sm, letterSpacing: 0.2,
  },
  ratingStarsRow: { flexDirection: 'row', gap: 6 },
  ratingStarBtn: { padding: 4 },
  ratingHint: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.sm, fontWeight: '600' },
  wishlistButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: borderRadius.sm,
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  wishlistButtonLiked: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  content: { padding: spacing.xl, paddingTop: spacing.lg },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 5,
  },
  title: {
    fontSize: 19, fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5, flex: 1,
  },
  verifiedBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.md, gap: 6,
  },
  locationDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 4,
  },
  location: {
    fontSize: 13, color: colors.textSecondary,
    fontWeight: '400', fontStyle: 'italic',
  },
  verifiedPill: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.25)',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: 4,
  },
  verifiedText: { fontSize: 10, color: colors.success, fontWeight: '700' },
  amenitiesContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginBottom: spacing.sm, gap: spacing.sm,
  },
  amenityChip: { borderRadius: borderRadius.md, overflow: 'hidden' },
  amenityGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm + 2, paddingVertical: 5,
    gap: 4,
  },
  amenityMore: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm + 2, paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  amenityText: {
    fontSize: 11, color: uiTheme.amenities.textColor,
    fontWeight: '700',
  },
  amenityTextMore: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  rulesContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginBottom: spacing.md, gap: 6,
  },
  ruleBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: borderRadius.md, gap: 4,
    borderWidth: 1,
  },
  ruleBadgeAllowed: {
    backgroundColor: 'rgba(34,197,94,0.07)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  ruleBadgeRestricted: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  ruleBadgeText: { fontSize: 10, color: uiTheme.rules.allowedText, fontWeight: '700' },
  ruleBadgeTextRestricted: { color: uiTheme.rules.restrictedText },
  dividerWrapper: { marginBottom: spacing.md, position: 'relative' },
  divider: { height: 1, backgroundColor: 'rgba(139,92,246,0.1)' },
  dividerShimmer: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: colors.primary,
  },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  priceBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  priceValue: {
    fontSize: 26, fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.8,
  },
  priceLabelPill: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  priceLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, opacity: 0.7 },
  bookButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg + 2, paddingVertical: spacing.md - 1,
    borderRadius: borderRadius.lg, gap: 7,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  bookButtonText: { color: colors.white, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  bookArrow: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  toast: {
    position: 'absolute', top: 100, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: borderRadius.xl, gap: 10,
    zIndex: 9999,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 12,
  },
  toastIconWrapper: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  toastSuccess: { backgroundColor: uiTheme.toast.success },
  toastError: { backgroundColor: uiTheme.toast.error },
  toastText: { color: colors.white, fontSize: 13, fontWeight: '700', flex: 1, letterSpacing: 0.1 },
});

export default SpaceCard;