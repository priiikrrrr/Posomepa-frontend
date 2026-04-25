import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';
import { spacesAPI } from '../../src/api/client';
import SpaceCard from '../../src/components/SpaceCard';
import PageHeader from '../../src/components/PageHeader';
import { useThemeColors, spacing } from '../../src/utils/theme';

const LIKED_STORAGE_KEY = '@liked_spaces';

export default function LikedScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [likedIds, setLikedIds] = useState([]);
  const queryClient = useQueryClient();

  const loadLikedIds = async () => {
    try {
      const stored = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
      if (stored) {
        setLikedIds(JSON.parse(stored));
      } else {
        setLikedIds([]);
      }
    } catch (error) {
      console.log('Error loading liked:', error);
      setLikedIds([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      loadLikedIds();
    }, [])
  );

  const { data: spacesData, isLoading, refetch } = useQuery({
    queryKey: ['spaces', 'all'],
    queryFn: () => spacesAPI.getAll({ limit: 100 }).then(res => res.data).catch(() => ({ spaces: [] })),
    retry: 1,
  });

  const allSpaces = spacesData?.spaces || [];
  const likedSpaces = allSpaces.filter(space => likedIds.includes(space._id));

  const onRefresh = async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
    await loadLikedIds();
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        title="Liked Properties"
        showBack={true}
        onBack={() => router.back()}
        variant="simple"
      />

      <FlatList
        data={likedSpaces}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.spaceItem}>
            <SpaceCard
              space={item}
              animationDelay={100}
              onPress={() => router.push(`/space/${item._id}`)}
            />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No liked properties</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap the heart icon on properties to save them here</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spaceItem: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
