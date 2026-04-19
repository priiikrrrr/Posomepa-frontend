import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal,
  Animated, Alert, ActivityIndicator, ScrollView, SafeAreaView, StatusBar,
  Dimensions, ImageBackground, AsyncStorage, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { spacesAPI, categoriesAPI, aiAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors } from '../../src/utils/theme';
import { headerGradients } from '../../src/utils/appTheme';
import { spacing } from '../../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LIKED_STORAGE_KEY = '@liked_spaces';

const getHeaderTheme = (isDark) => isDark ? headerGradients.search?.dark || headerGradients.home.dark : headerGradients.search?.light || headerGradients.home.light;

/* ─── GridSpaceCard (identical to HomeScreen) ─── */
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
      } catch (e) {}
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
    } catch (e) {}

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
  card: { width: (SCREEN_WIDTH - 48) / 2, marginBottom: 16, borderRadius: 16, shadowColor: '#8B5CF6', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4, overflow: 'hidden' },
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
  name: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  loc: { fontSize: 10, marginTop: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 1 },
  price: { fontSize: 15, fontWeight: '800', letterSpacing: -0.5 },
  unit: { fontSize: 10 },
});

/* ─── Premium Category Chip ─── */
function PremiumCategoryChip({ category, selected, onPress, colors }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[pcStyles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceSecondary }]}>
      <Ionicons name={category.icon || 'apps-outline'} size={13} color={selected ? '#fff' : (category.color || colors.primary)} />
      <Text style={[pcStyles.text, { color: selected ? '#fff' : colors.textSecondary }]}>{category.name}</Text>
    </TouchableOpacity>
  );
}
const pcStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, marginRight: 8 },
  text: { fontSize: 13, fontWeight: '600' },
});

/* ─── Sort Chip ─── */
function SortChip({ label, icon, active, onPress, colors }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[sortStyles.chip, { backgroundColor: active ? colors.primary : colors.surfaceSecondary }]}>
      <Ionicons name={icon} size={13} color={active ? '#fff' : colors.primary} />
      <Text style={[sortStyles.text, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const sortStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 30 },
  text: { fontSize: 11, fontWeight: '600' },
});

/* ─── Main Search Screen ─── */
export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridPageIndex, setGridPageIndex] = useState(0);
  const gridPageWidth = SCREEN_WIDTH - 32;
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  const currentHeaderTheme = getHeaderTheme(isDark) || headerGradients.home.light;

  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const rt = (anim, dur, delay = 0) => Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: dur, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: dur, useNativeDriver: true }),
    ]));
    [rt(wave1, 4500, 0), rt(wave2, 5500, 800)].forEach(a => a.start());
    return () => [wave1, wave2].forEach(a => a.stopAnimation());
  }, []);
  const b1Y = wave1.interpolate({ inputRange: [0, 1], outputRange: [-25, 25] });
  const b1X = wave1.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
  const b2Y = wave2.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const b2X = wave2.interpolate({ inputRange: [0, 1], outputRange: [12, -12] });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data),
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

  const { data: allSpacesData, isLoading: allLoading } = useQuery({
    queryKey: ['allSpaces'],
    queryFn: () => spacesAPI.getAll({ limit: 100 }).then(res => res.data),
    enabled: !searchQuery && !selectedCategory,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', searchQuery, selectedCategory?.name],
    queryFn: () => {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory.name;
      return spacesAPI.getAll(params).then(res => res.data);
    },
    enabled: searchQuery.length > 0 || selectedCategory !== null,
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['aiSuggestions'],
    queryFn: () => aiAPI.getSuggestions().then(res => res.data),
    enabled: aiModalVisible,
  });

  const aiSearchMutation = useMutation({
    mutationFn: (query) => aiAPI.search(query),
    onSuccess: (data) => {
      if (data.spaces && data.spaces.length > 0) {
        setSearchQuery(data.summary || aiSearchQuery);
      } else {
        Alert.alert('No Results', 'No properties found matching your search.');
      }
      setAiModalVisible(false);
      setAiSearchQuery('');
    },
    onError: (error) => {
      Alert.alert('AI Search Error', error.response?.data?.message || 'Something went wrong.');
    },
  });

  useEffect(() => {
    if (aiModalVisible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [aiModalVisible]);

  const results = (searchQuery || selectedCategory)
    ? (searchData?.spaces || [])
    : (allSpacesData?.spaces || []);
  const isLoading = (searchQuery || selectedCategory) ? searchLoading : allLoading;

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const handleAiSearch = () => {
    if (aiSearchQuery.trim()) aiSearchMutation.mutate(aiSearchQuery.trim());
  };

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
        <LinearGradient colors={currentHeaderTheme.gradient} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[styles.auroraBlob1, { transform: [{ translateY: b1Y }, { translateX: b1X }] }]} />
        <Animated.View style={[styles.auroraBlob2, { transform: [{ translateY: b2Y }, { translateX: b2X }] }]} />
        <LinearGradient colors={['transparent', colors.background]} locations={[0.5, 1]} style={styles.headerFade} pointerEvents="none" />

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerLabel}>DISCOVER</Text>
            <Text style={styles.headerTitle}>Find Your Space</Text>
          </View>
          <TouchableOpacity onPress={() => setAiModalVisible(true)} style={styles.aiButton}>
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.aiButtonGrad}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.aiButtonText}>AI Search</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBarWrap}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search spaces, locations..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <PremiumCategoryChip
            category={{ name: 'All', icon: 'apps-outline' }}
            selected={!selectedCategory}
            onPress={() => {
              if (selectedCategory) setSelectedCategory(null);
              else setShowGrid(!showGrid);
            }}
            colors={colors}
          />
          <SortChip
            label="Cheapest" icon="arrow-up-outline"
            active={sortBy === 'price_asc'}
            onPress={() => setSortBy(sortBy === 'price_asc' ? null : 'price_asc')}
            colors={colors}
          />
          <SortChip
            label="Priciest" icon="arrow-down-outline"
            active={sortBy === 'price_desc'}
            onPress={() => setSortBy(sortBy === 'price_desc' ? null : 'price_desc')}
            colors={colors}
          />
          <SortChip
            label="Top Rated" icon="star-outline"
            active={sortBy === 'rating'}
            onPress={() => setSortBy(sortBy === 'rating' ? null : 'rating')}
            colors={colors}
          />
          <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />
          {categories.map((cat) => (
            <PremiumCategoryChip
              key={cat._id}
              category={cat}
              selected={selectedCategory?._id === cat._id}
              onPress={() => { setSelectedCategory(cat); setShowGrid(false); }}
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
                        <View key={`e-${i}`} style={[styles.gridItem, { borderColor: 'transparent', backgroundColor: 'transparent' }]} />
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

      <View style={styles.resultsArea}>
        {!isLoading && (
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
              {sortedResults.length} {sortedResults.length === 1 ? 'space' : 'spaces'} found
            </Text>
            {selectedCategory && (
              <TouchableOpacity
                style={[styles.activePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                onPress={() => setSelectedCategory(null)}
              >
                <Ionicons name={selectedCategory.icon || 'apps-outline'} size={11} color={colors.primary} />
                <Text style={[styles.activePillText, { color: colors.primary }]}>{selectedCategory.name}</Text>
                <Ionicons name="close" size={11} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textLight }]}>Finding spaces...</Text>
          </View>
        ) : sortedResults.length > 0 ? (
          <FlatList
            data={sortedResults}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <GridSpaceCard
                space={item}
                onPress={() => router.push(`/space/${item._id}`)}
                colors={colors}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconRing, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="search-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
              {searchQuery || selectedCategory ? 'No results found' : 'Search for spaces'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
              {searchQuery || selectedCategory ? 'Try different keywords or filters' : 'Enter a keyword or pick a category'}
            </Text>
          </View>
        )}
      </View>

      <Modal visible={aiModalVisible} transparent animationType="fade" onRequestClose={() => setAiModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAiModalVisible(false)}>
          <Animated.View style={[styles.aiSheet, { transform: [{ translateY: slideAnim }], backgroundColor: colors.surface }]}>
            <TouchableOpacity activeOpacity={1}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

              <View style={styles.aiSheetContent}>
                <View style={styles.aiHeaderRow}>
                  <View style={styles.aiTitleGroup}>
                    <LinearGradient colors={[colors.primary, colors.primaryDark || '#6D28D9']} style={styles.aiIconRing}>
                      <Ionicons name="sparkles" size={18} color="#fff" />
                    </LinearGradient>
                    <View>
                      <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>AI Search</Text>
                      <Text style={[styles.aiSub, { color: colors.textLight }]}>Describe what you're looking for</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setAiModalVisible(false)} style={[styles.aiClose, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.aiInputRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.aiInput, { color: colors.textPrimary }]}
                    placeholder="e.g. rooftop with pool for 20 people..."
                    placeholderTextColor={colors.textLight}
                    value={aiSearchQuery}
                    onChangeText={setAiSearchQuery}
                    onSubmitEditing={handleAiSearch}
                    returnKeyType="search"
                    multiline={false}
                  />
                  <TouchableOpacity
                    onPress={handleAiSearch}
                    disabled={aiSearchMutation.isPending || !aiSearchQuery.trim()}
                    style={[styles.aiSendBtn, (!aiSearchQuery.trim() || aiSearchMutation.isPending) && { opacity: 0.5 }]}
                  >
                    <LinearGradient colors={[colors.primary, colors.primaryDark || '#6D28D9']} style={styles.aiSendGrad}>
                      {aiSearchMutation.isPending
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Ionicons name="send" size={16} color="#fff" />}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {(suggestionsData?.suggestions || []).length > 0 && (
                  <>
                    <Text style={[styles.suggTitle, { color: colors.textSecondary }]}>Try these</Text>
                    <View style={styles.suggRow}>
                      {(suggestionsData?.suggestions || []).map((s, i) => (
                        <TouchableOpacity key={i} style={[styles.suggChip, { backgroundColor: colors.primary + '20' }]} onPress={() => { setAiSearchQuery(s); aiSearchMutation.mutate(s); }}>
                          <Ionicons name="search-outline" size={11} color={colors.primary} />
                          <Text style={[styles.suggText, { color: colors.primary }]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { height: 210, position: 'relative', overflow: 'hidden' },
  auroraBlob1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -150, right: -60, backgroundColor: 'rgba(139,92,246,0.28)' },
  auroraBlob2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: -40, left: -70, backgroundColor: 'rgba(13,148,136,0.15)' },
  headerFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 18 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: 'rgba(167,139,250,0.9)', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#F5F3FF', letterSpacing: -0.8 },
  aiButton: { borderRadius: 22, overflow: 'hidden' },
  aiButtonGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22 },
  aiButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  searchBarWrap: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#8B5CF6', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  filterBar: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 0 },
  filterDivider: { width: 1, height: 24, marginHorizontal: 6, alignSelf: 'center' },

  categoryGridOuter: { marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 20, paddingVertical: 12 },
  categoryPage: { paddingHorizontal: 12 },
  categoryGridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  gridItem: { alignItems: 'center', padding: 8, borderRadius: 14, borderWidth: 1, width: (SCREEN_WIDTH - 56) / 4 },
  gridIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  gridLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pageDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 8, marginBottom: 4 },
  pageDot: { height: 5, borderRadius: 2.5 },

  resultsArea: { flex: 1, paddingHorizontal: 16 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, paddingBottom: 10 },
  resultCount: { fontSize: 12, fontWeight: '600' },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  activePillText: { fontSize: 11, fontWeight: '700' },
  gridRow: { justifyContent: 'space-between' },
  listContent: { paddingBottom: 120 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIconRing: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySubtext: { fontSize: 13, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  aiSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12 },
  aiSheetContent: { padding: 20 },
  aiHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  aiTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIconRing: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  aiTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', letterSpacing: -0.4 },
  aiSub: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  aiClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  aiInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  aiInput: { flex: 1, fontSize: 15, color: '#1E293B', minHeight: 40 },
  aiSendBtn: { borderRadius: 20, overflow: 'hidden' },
  aiSendGrad: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  suggTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, letterSpacing: 0.3 },
  suggRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  suggText: { fontSize: 12, color: '#8B5CF6', fontWeight: '600' },
});
