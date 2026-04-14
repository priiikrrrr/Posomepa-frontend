import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { bookingsAPI } from '../../src/api/client';
import BookingCard from '../../src/components/BookingCard';
import CompactHeader from '../../src/components/CompactHeader';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius, shadows, commonStyles } from '../../src/utils/theme';

export default function HostBookings() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const { data: hostData, isLoading, refetch } = useQuery({
    queryKey: ['hostBookings', filter],
    queryFn: () => bookingsAPI.getHostBookings({ 
      status: filter === 'all' || filter === 'paid' ? undefined : filter,
      paymentStatus: filter === 'paid' ? 'paid' : undefined,
      limit: 100 
    }).then(res => res.data),
  });

  const bookings = hostData?.bookings || [];
  
  const paidCount = bookings.filter(b => b.paymentStatus === 'paid').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : filter === 'paid'
      ? bookings.filter(b => b.paymentStatus === 'paid')
      : bookings.filter(b => b.status === filter);

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <CompactHeader
        title="My Bookings"
        subtitle="Host View"
        showBack={true}
        onBack={() => router.back()}
        rightAction={false}
      />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{bookings.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textLight }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{paidCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textLight }]}>Paid</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{cancelledCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textLight }]}>Cancelled</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            isHost
            onPress={() => router.push(`/booking/confirmation?id=${item._id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139,92,246,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  filterScrollContent: {
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
    fontWeight: '500',
  },
});
