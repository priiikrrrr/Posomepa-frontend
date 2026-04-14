import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions, Alert,
  StyleSheet, TextInput, Modal, Animated, StatusBar, ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'react-native';
import { spacesAPI, messagesAPI, reviewsAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius, shadows } from '../../src/utils/theme';
import MapView from '../../src/components/MapView';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 320;

/* ─── Amenity Chip ─── */
function AmenityChip({ label, colors }) {
  return (
    <View style={[achStyles.chip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
      <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
      <Text style={[achStyles.text, { color: colors.primary }]}>{label}</Text>
    </View>
  );
}
const achStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 7, marginBottom: 7 },
  text: { fontSize: 11, fontWeight: '600' },
});

/* ─── Rule Chip ─── */
function RuleChip({ label }) {
  // Rules that restrict (show red with cross)
  const restrictive = label.includes('Not ') || label.includes('Not Allowed') || label.startsWith('No ') || label.startsWith('No ') || label.includes('Max ');
  return (
    <View style={[rchStyles.chip, restrictive ? rchStyles.bad : rchStyles.good]}>
      <Ionicons name={restrictive ? 'close-circle' : 'checkmark-circle'} size={12} color={restrictive ? '#DC2626' : '#16A34A'} />
      <Text style={[rchStyles.text, { color: restrictive ? '#DC2626' : '#16A34A' }]}>{label}</Text>
    </View>
  );
}
const rchStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 7, marginBottom: 7 },
  good: { backgroundColor: '#DCFCE7', borderColor: '#16A34A40' },
  bad: { backgroundColor: '#FEE2E2', borderColor: '#DC262640' },
  text: { fontSize: 11, fontWeight: '600' },
});

/* ─── Section Header ─── */
function SectionTitle({ title, colors }) {
  return (
    <View style={stStyles.row}>
      <View style={[stStyles.accent, { backgroundColor: colors.primary }]} />
      <Text style={[stStyles.text, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}
const stStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 24 },
  accent: { width: 3, height: 18, borderRadius: 2 },
  text: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
});

/* ─── Star Rating Row ─── */
function StarRow({ rating, onPress, size = 14 }) {
  return (
    <TouchableOpacity style={srStyles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons key={s} name={s <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color="#F59E0B" />
      ))}
    </TouchableOpacity>
  );
}
const srStyles = StyleSheet.create({ row: { flexDirection: 'row', gap: 2 } });

/* ─── Info Row ─── */
function InfoRow({ icon, label, value, colors }) {
  return (
    <View style={irStyles.row}>
      <View style={[irStyles.iconBox, { backgroundColor: colors.primary + '14' }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View>
        <Text style={[irStyles.label, { color: colors.textLight }]}>{label}</Text>
        <Text style={[irStyles.value, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}
const irStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 13, fontWeight: '700', marginTop: 1 },
});

/* ─── Main Screen ─── */
export default function SpaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const [currentImage, setCurrentImage] = useState(0);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [IMAGE_HEIGHT - 100, IMAGE_HEIGHT - 40], outputRange: [0, 1], extrapolate: 'clamp' });
  const imageScale = scrollY.interpolate({ inputRange: [-80, 0], outputRange: [1.18, 1], extrapolate: 'clamp' });

  const { data: space, isLoading } = useQuery({
    queryKey: ['space', id],
    queryFn: () => spacesAPI.getById(id).then(res => res.data),
  });

  const { data: myMessages } = useQuery({
    queryKey: ['myMessages'],
    queryFn: () => messagesAPI.getMy().then(res => res.data),
    enabled: !!user,
  });

  const existingThread = space && myMessages?.messages?.find(
    m => m.property?._id === space._id && !m.deletedBySender
  );
  const isThreadOpen = existingThread && (!existingThread.closedAt || new Date() <= new Date(existingThread.closedAt));

  const sendMessageMutation = useMutation({
    mutationFn: (content) => messagesAPI.send({ propertyId: space._id, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMessages'] });
      setMessageModalVisible(false);
      setMessageText('');
      Alert.alert('Sent!', 'Your message is on its way to the host.');
    },
    onError: (error) => Alert.alert('Failed', error.response?.data?.message || 'Failed to send message'),
  });

  const addReviewMutation = useMutation({
    mutationFn: (data) => reviewsAPI.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space', id] });
      setReviewModalVisible(false);
      setReviewRating(5);
      setReviewComment('');
      Alert.alert('Review added!', 'Thanks for sharing your experience.');
    },
    onError: (error) => Alert.alert('Failed', error.response?.data?.message || 'Failed to add review'),
  });

  const SOCIAL_MEDIA_ABBREVS = [
    /ig|wa|wp|tg|sc|tt|fb|x\b|yt/i,
  ];

  const checkSocialMedia = (text) => {
    for (const pattern of SOCIAL_MEDIA_ABBREVS) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  };

  const handleSendMessage = (content) => {
    if (checkSocialMedia(content)) {
      Alert.alert(
        'Message Not Allowed',
        'Social media abbreviations (ig, wa, wp, tg, sc, tt, fb, x, yt) are not allowed. Please rephrase your message.',
        [{ text: 'OK' }]
      );
      return;
    }
    sendMessageMutation.mutate(content);
  };

  const handleMessageHost = () => {
    if (!user) { Alert.alert('Login Required', 'Please login to message the host', [{ text: 'Cancel', style: 'cancel' }, { text: 'Login', onPress: () => router.push('/login') }]); return; }
    if (user.id === space.owner?._id || user._id === space.owner?._id) { Alert.alert('Cannot Message', 'You cannot message yourself'); return; }
    if (isThreadOpen) { Alert.alert('Thread Exists', 'You already have an open conversation. Visit Notifications to continue.', [{ text: 'View Thread', onPress: () => router.push('/profile/notifications') }, { text: 'Cancel', style: 'cancel' }]); return; }
    setMessageModalVisible(true);
  };

  const handleBookPress = () => {
    if (!user) { Alert.alert('Login Required', 'Please login to book this space', [{ text: 'Cancel', style: 'cancel' }, { text: 'Login', onPress: () => router.push('/login') }]); return; }
    router.push(`/space/book?id=${space._id}`);
  };

  const formatPrice = (price, priceType) => {
    if (priceType === 'hourly') return `₹${price}/hr`;
    if (priceType === 'daily') return `₹${price}/day`;
    if (priceType === 'monthly') return `₹${price}/mo`;
    return `₹${price}`;
  };

  if (isLoading || !space) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingPulse, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="home-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading space...</Text>
      </View>
    );
  }

  const images = space.images?.length > 0 ? space.images : [null];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Sticky header bar (fades in on scroll) ── */}
      <Animated.View style={[styles.stickyHeader, { backgroundColor: colors.background, opacity: headerOpacity, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.stickyBackBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.stickyTitle, { color: colors.textPrimary }]} numberOfLines={1}>{space.name}</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* ── IMAGE CAROUSEL ── */}
        <View style={styles.imageContainer}>
          <Animated.View style={[{ transform: [{ scale: imageScale }], height: IMAGE_HEIGHT }]}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {images.map((img, idx) =>
                img ? (
                  <ImageBackground key={idx} source={{ uri: img }} style={styles.image}>
                    <LinearGradient colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFillObject} />
                  </ImageBackground>
                ) : (
                  <LinearGradient key={idx} colors={[colors.primary + '30', colors.primary + '10']} style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="home-outline" size={48} color={colors.primary} />
                  </LinearGradient>
                )
              )}
            </ScrollView>
          </Animated.View>

          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Image counter pill */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{currentImage + 1} / {images.length}</Text>
            </View>
          )}

          {/* Rating badge on image */}
          <View style={styles.ratingOverlay}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingOverlayText}>{space.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.ratingOverlaySub}>({space.reviewCount || 0})</Text>
          </View>

          {/* Bottom image dots */}
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.imageDot, i === currentImage && styles.imageDotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── CONTENT ── */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>

          {/* Title + category pill */}
          <View style={styles.titleBlock}>
            <View style={[styles.categoryPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.categoryPillText, { color: colors.primary }]}>{space.category?.name || 'Space'}</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{space.name}</Text>
            <View style={styles.titleMeta}>
              <Ionicons name="location-outline" size={13} color={colors.textLight} />
              <Text style={[styles.titleMetaText, { color: colors.textLight }]}>{space.location?.address}, {space.location?.city}</Text>
            </View>
          </View>

          {/* ── PRICE CARD ── */}
          <LinearGradient
            colors={isDark ? ['#1e1040', '#2d1870'] : ['#7C3AED', '#9333EA']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.priceCard}
          >
            <View style={styles.priceLeft}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>{formatPrice(space.price, space.priceType)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRight}>
              <StarRow rating={space.rating || 0} size={13} />
              <Text style={styles.priceReviews}>{space.reviewCount || 0} reviews</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(true)} style={styles.addReviewBtn}>
                <Ionicons name="add" size={11} color="#fff" />
                <Text style={styles.addReviewBtnText}>Add Review</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ── QUICK INFO GRID ── */}
          <View style={[styles.infoGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <InfoRow icon="people-outline" label="Capacity" value={space.capacity ? `${space.capacity} guests` : 'Flexible'} colors={colors} />
            <View style={[styles.infoGridDivider, { backgroundColor: colors.border }]} />
            <InfoRow icon="time-outline" label="Availability" value={space.availability || 'Flexible'} colors={colors} />
          </View>

          {/* ── DESCRIPTION ── */}
          <SectionTitle title="About this space" colors={colors} />
          <Text style={[styles.description, { color: colors.textSecondary }]}>{space.description}</Text>

          {/* ── HOST NOTES ── */}
          {space.notes && (
            <>
              <SectionTitle title="Host Notes" colors={colors} />
              <View style={[styles.notesCard, { backgroundColor: colors.primary + '0C', borderColor: colors.primary + '25' }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={[styles.notesText, { color: colors.textPrimary }]}>{space.notes}</Text>
              </View>
            </>
          )}

          {/* ── AMENITIES ── */}
          {space.amenities?.length > 0 && (
            <>
              <SectionTitle title="Amenities" colors={colors} />
              <View style={styles.chipsWrap}>
                {space.amenities.map((a, i) => <AmenityChip key={i} label={a} colors={colors} />)}
              </View>
            </>
          )}

          {/* ── RULES ── */}
          {space.rules?.length > 0 && (
            <>
              <SectionTitle title="House Rules" colors={colors} />
              <View style={styles.chipsWrap}>
                {[...new Set(space.rules)].map((r, i) => <RuleChip key={i} label={r} />)}
              </View>
            </>
          )}

          {/* ── MAP ── */}
          <SectionTitle title="Location" colors={colors} />
          <View style={[styles.mapWrapper, { borderColor: colors.border }]}>
            <MapView
              coordinates={space.location?.coordinates}
              address={`${space.location?.address}, ${space.location?.city}`}
            />
          </View>

          {/* ── HOST CARD ── */}
          <SectionTitle title="Your Host" colors={colors} />
          <View style={[styles.hostCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.hostAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.hostInfo}>
              <Text style={[styles.hostName, { color: colors.textPrimary }]}>{space.owner?.name}</Text>
              {space.owner?.hostApplicationStatus === 'verified' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified Host</Text>
                </View>
              )}
              {space.owner?.phone && (
                <Text style={[styles.hostPhone, { color: colors.textLight }]}>{space.owner.phone}</Text>
              )}
            </View>
            <TouchableOpacity onPress={handleMessageHost} style={[styles.hostMsgBtn, { borderColor: colors.primary }]}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* ── FOOTER ── */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {isThreadOpen ? (
          <TouchableOpacity onPress={() => router.push('/profile/notifications')} style={[styles.msgBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="chatbubbles" size={18} color="#fff" />
            <Text style={styles.msgBtnTextActive}>Conversation</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleMessageHost} style={[styles.msgBtn, { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' }]}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={[styles.msgBtnText, { color: colors.primary }]}>Message</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleBookPress} activeOpacity={0.88} style={styles.bookBtnWrapper}>
          <LinearGradient
            colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.bookBtn}
          >
            <Text style={styles.bookBtnText}>Book Now</Text>
            <View style={styles.bookBtnArrow}>
              <Ionicons name="arrow-forward" size={13} color="#8B5CF6" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── MESSAGE MODAL ── */}
      <Modal visible={messageModalVisible} animationType="slide" transparent onRequestClose={() => setMessageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Message Host</Text>
                <Text style={[styles.modalSub, { color: colors.textLight }]}>Ask anything before you book</Text>
              </View>
              <TouchableOpacity onPress={() => setMessageModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {space.images?.[0] && (
              <View style={[styles.miniCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Image source={{ uri: space.images[0] }} style={styles.miniImg} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.miniTitle, { color: colors.textPrimary }]} numberOfLines={1}>{space.name}</Text>
                  <Text style={[styles.miniSub, { color: colors.textLight }]}>{space.location?.city}</Text>
                </View>
              </View>
            )}

            <TextInput
              style={[styles.msgInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Hi! I wanted to ask about..."
              placeholderTextColor={colors.textLight}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.textLight }]}>{messageText.length}/500</Text>
            <Text style={[styles.msgHint, { color: colors.textLight }]}>Keep messages property-related. Contact info and payment details are not allowed.</Text>

            <TouchableOpacity
              style={[styles.sendBtn, (!messageText.trim() || sendMessageMutation.isPending) && { opacity: 0.5 }]}
              onPress={() => handleSendMessage(messageText)}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtnGrad}>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>{sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── REVIEW MODAL ── */}
      <Modal visible={reviewModalVisible} animationType="slide" transparent onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Leave a Review</Text>
                <Text style={[styles.modalSub, { color: colors.textLight }]}>How was your experience?</Text>
              </View>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Big star picker */}
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setReviewRating(s)} activeOpacity={0.7}>
                  <Ionicons name={s <= reviewRating ? 'star' : 'star-outline'} size={42} color={s <= reviewRating ? '#F59E0B' : colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.starLabel, { color: colors.textSecondary }]}>
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][reviewRating]}
            </Text>

            <TextInput
              style={[styles.msgInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Tell us what you loved (or didn't)..."
              placeholderTextColor={colors.textLight}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.textLight }]}>{reviewComment.length}/500</Text>

            <TouchableOpacity
              style={[styles.sendBtn, addReviewMutation.isPending && { opacity: 0.5 }]}
              onPress={() => addReviewMutation.mutate({ spaceId: id, rating: reviewRating, comment: reviewComment })}
              disabled={addReviewMutation.isPending}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtnGrad}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>{addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* loading */
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingPulse: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, fontWeight: '600' },

  /* sticky header */
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1 },
  stickyBackBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stickyTitle: { flex: 1, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },

  /* image */
  imageContainer: { height: IMAGE_HEIGHT, overflow: 'hidden' },
  image: { width, height: IMAGE_HEIGHT },
  backButton: { position: 'absolute', top: 52, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  imageCounter: { position: 'absolute', top: 52, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ratingOverlay: { position: 'absolute', bottom: 48, left: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  ratingOverlayText: { color: '#F59E0B', fontSize: 13, fontWeight: '800' },
  ratingOverlaySub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  imageDots: { position: 'absolute', bottom: 18, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  imageDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  imageDotActive: { width: 16, backgroundColor: '#fff' },

  /* content */
  content: { borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, paddingHorizontal: 20, paddingTop: 24 },

  /* title block */
  titleBlock: { marginBottom: 20 },
  categoryPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  categoryPillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6, lineHeight: 30, marginBottom: 8 },
  titleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  titleMetaText: { fontSize: 13, fontWeight: '500' },

  /* price card */
  priceCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  priceLeft: { flex: 1 },
  priceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  priceValue: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  priceDivider: { width: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20 },
  priceRight: { alignItems: 'flex-end', gap: 4 },
  priceReviews: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  addReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, marginTop: 4 },
  addReviewBtnText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  /* info grid */
  infoGrid: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4 },
  infoGridDivider: { width: 1, marginHorizontal: 16 },

  /* description */
  description: { fontSize: 14, lineHeight: 24, fontWeight: '400' },

  /* notes */
  notesCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  notesText: { flex: 1, fontSize: 13, lineHeight: 21 },

  /* chips */
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },

  /* map */
  mapWrapper: { borderRadius: 18, overflow: 'hidden', borderWidth: 1 },

  /* host card */
  hostCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
  hostAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  hostInfo: { flex: 1, gap: 3 },
  hostName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  verifiedText: { fontSize: 10, color: '#16A34A', fontWeight: '700' },
  hostPhone: { fontSize: 12, fontWeight: '500' },
  hostMsgBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },

  /* footer */
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 30, borderTopWidth: 1 },
  msgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, flex: 0.42 },
  msgBtnText: { fontSize: 13, fontWeight: '700' },
  msgBtnTextActive: { fontSize: 13, fontWeight: '700', color: '#fff' },
  bookBtnWrapper: { flex: 0.58, borderRadius: 14, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
  bookBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  bookBtnArrow: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  /* modals */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  modalTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  modalSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  miniCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  miniImg: { width: 48, height: 48, borderRadius: 10 },
  miniTitle: { fontSize: 13, fontWeight: '700' },
  miniSub: { fontSize: 11, marginTop: 2 },
  msgInput: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14, minHeight: 110, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6, marginBottom: 4 },
  msgHint: { fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 16 },
  sendBtn: { borderRadius: 14, overflow: 'hidden' },
  sendBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  starPicker: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  starLabel: { textAlign: 'center', fontSize: 13, fontWeight: '600', marginBottom: 18 },
});