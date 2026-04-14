import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacesAPI, bookingsAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { Image } from 'react-native';
import { useThemeColors } from '../../src/utils/theme';

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

const TERMS_TEXT = "By proceeding with this booking, I acknowledge that PosomePa serves solely as a platform connecting property owners and guests. I understand that PosomePa does not intervene in or bear responsibility for any disputes arising from this booking.";

export default function BookSpaceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: space } = useQuery({
    queryKey: ['space', id],
    queryFn: () => spacesAPI.getById(id).then(res => res.data),
  });

  // Refetch bookings when page mounts or date changes
  useEffect(() => {
    console.log('Booking page mounted or date changed, selectedDate:', selectedDate?.toISOString().split('T')[0]);
  }, [selectedDate]);

  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings', id, selectedDate?.toISOString().split('T')[0]],
    queryFn: () => bookingsAPI.getBySpace(id, { date: selectedDate?.toISOString().split('T')[0] }).then(res => {
      const bookings = res.data || [];
      
      const slots = [];
      bookings.forEach(booking => {
        if (booking.status !== 'cancelled') {
          const start = parseInt(booking.startTime?.split(':')[0] || 0);
          const end = parseInt(booking.endTime?.split(':')[0] || 0);
          for (let i = start; i < end; i++) {
            slots.push(`${String(i).padStart(2, '0')}:00`);
          }
        }
      });
      console.log('Fetched bookings for', selectedDate?.toISOString().split('T')[0], ':', bookings.length, 'slots:', slots);
      setBookedSlots(slots);
      return res.data;
    }),
    enabled: !!selectedDate && !!id,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Get host blocked dates
  const { data: blockedData, refetch: refetchBlocked } = useQuery({
    queryKey: ['blockedDates', id],
    queryFn: () => spacesAPI.getBlockedDates(id).then(res => res.data),
    enabled: !!id,
    refetchOnMount: true,
    staleTime: 0,
  });

  const isDateBlocked = (date) => {
    if (!blockedData?.hostBlocked) return false;
    const dateStr = date.toISOString().split('T')[0];
    return blockedData.hostBlocked.some(block => {
      const start = new Date(block.startDate).toISOString().split('T')[0];
      const end = new Date(block.endDate).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const createBookingMutation = useMutation({
    mutationFn: bookingsAPI.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      router.replace(`/booking/confirmation?id=${data.data.booking._id}`);
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Booking failed');
    },
  });

  const next30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const formatDate = (date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  const getCurrentHour = () => new Date().getHours();

  const isTimeDisabled = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (isToday(selectedDate) && hour <= getCurrentHour()) {
      return true;
    }
    const isDisabled = bookedSlots.includes(time);
    console.log('isTimeDisabled:', time, 'bookedSlots:', bookedSlots, 'result:', isDisabled);
    return isDisabled;
  };

  const isSlotBooked = (time) => bookedSlots.includes(time);

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return Math.max(0, end - start);
  };

  const calculateTotal = () => {
    if (!space) return 0;
    const hours = calculateDuration();
    return hours * space.price;
  };

  const handleBooking = () => {
    if (!selectedDate || !startTime || !endTime) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Terms & Conditions', 'Please accept the terms and conditions to proceed');
      return;
    }

    const duration = calculateDuration();
    if (duration < 1) {
      Alert.alert('Error', 'Minimum booking is 1 hour');
      return;
    }

    createBookingMutation.mutate({
      spaceId: id,
      date: selectedDate.toISOString(),
      startTime,
      endTime,
      amount: calculateTotal(),
      notes,
      termsAccepted: true,
    });
  };

  if (!space) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1E1B4B' : '#8B5CF6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Book Space</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{space.name}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          {/* Space Info Card */}
          <View style={[styles.spaceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image
              source={{ uri: space.images?.[0] || 'https://placehold.co/400x300/8B5CF6/ffffff?text=No+Image' }}
              style={styles.spaceImage}
            />
            <View style={styles.spaceInfo}>
              <Text style={[styles.spaceTitle, { color: colors.textPrimary }]} numberOfLines={1}>{space.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textLight} />
                <Text style={[styles.locationText, { color: colors.textLight }]}>{space.location?.city}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.spacePrice, { color: colors.primary }]}>₹{space.price}</Text>
                <Text style={[styles.priceType, { color: colors.textLight }]}>/{space.priceType || 'hour'}</Text>
              </View>
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Date</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.dateScroll}
          >
            {next30Days.map((date, idx) => {
              const blocked = isDateBlocked(date);
              return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  if (blocked) {
                    Alert.alert('Blocked', 'This date is not available');
                    return;
                  }
                  setSelectedDate(date);
                  setStartTime(null);
                  setEndTime(null);
                }}
                style={[
                  styles.dateChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedDate?.toDateString() === date.toDateString() && { backgroundColor: colors.primary, borderColor: colors.primary },
                  blocked && { backgroundColor: colors.errorLight, borderColor: colors.error }
                ]}
              >
                <Text style={[
                  styles.dateText,
                  { color: colors.textPrimary },
                  selectedDate?.toDateString() === date.toDateString() && { color: '#fff' },
                  blocked && { color: colors.error }
                ]}>
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Selection */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Time</Text>
          </View>
          <View style={styles.timeContainer}>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeLabel, { color: colors.textLight }]}>From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.map((time) => {
                    const disabled = isTimeDisabled(time);
                    const booked = isSlotBooked(time);
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => !disabled && setStartTime(time)}
                        disabled={disabled}
                        style={[
                          styles.timeSlot,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          startTime === time && { backgroundColor: colors.primary, borderColor: colors.primary },
                          disabled && { backgroundColor: colors.gray100, borderColor: colors.gray200 },
                        ]}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          { color: colors.textPrimary },
                          startTime === time && { color: '#fff' },
                          disabled && { color: colors.textLight },
                        ]}>
                          {time}
                        </Text>
                        {booked && <Text style={styles.bookedLabel}>Booked</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.timeColumn}>
              <Text style={[styles.timeLabel, { color: colors.textLight }]}>To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.map((time) => {
                    const disabled = !startTime || isTimeDisabled(time) || parseInt(time.split(':')[0]) <= parseInt(startTime?.split(':')[0]);
                    const booked = isSlotBooked(time);
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => !disabled && setEndTime(time)}
                        disabled={disabled}
                        style={[
                          styles.timeSlot,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          endTime === time && { backgroundColor: colors.primary, borderColor: colors.primary },
                          disabled && { backgroundColor: colors.gray100, borderColor: colors.gray200 },
                        ]}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          { color: colors.textPrimary },
                          endTime === time && { color: '#fff' },
                          disabled && { color: colors.textLight },
                        ]}>
                          {time}
                        </Text>
                        {booked && <Text style={styles.bookedLabel}>Booked</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.gray300 }]} />
              <Text style={[styles.legendText, { color: colors.textLight }]}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.textLight }]} />
              <Text style={[styles.legendText, { color: colors.textLight }]}>Disabled</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.legendText, { color: colors.textLight }]}>Booked</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes</Text>
          </View>
          <View style={[styles.notesInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.notesTextInput, { color: colors.textPrimary }]}
              placeholder="Any special requests..."
              placeholderTextColor={colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Price Summary - Gradient Card */}
          <LinearGradient
            colors={isDark ? ['#1e1040', '#2d1870'] : ['#7C3AED', '#9333EA']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{calculateDuration()} hours</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>₹{space.price}/hour</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
            </View>
          </LinearGradient>

          {/* Terms & Conditions */}
          <TouchableOpacity 
            style={[styles.termsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsAccepted && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[styles.termsText, { color: colors.textLight }]}>{TERMS_TEXT}</Text>
          </TouchableOpacity>

          {/* Book Button */}
          <TouchableOpacity
            onPress={handleBooking}
            disabled={!startTime || !endTime || !termsAccepted || createBookingMutation.isPending}
            activeOpacity={0.88}
            style={styles.bookBtnWrapper}
          >
            <LinearGradient
              colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.bookBtn, (!startTime || !endTime || !termsAccepted || createBookingMutation.isPending) && { opacity: 0.5 }]}
            >
              <Text style={styles.bookBtnText}>
                {createBookingMutation.isPending ? 'Processing...' : 'Book Now'}
              </Text>
              <View style={styles.bookBtnArrow}>
                <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  content: {
    padding: 20,
    marginTop: -8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 20,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  spaceCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  spaceImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  spaceInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  spaceTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  spacePrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  priceType: {
    fontSize: 12,
    marginLeft: 2,
  },
  dateScroll: {
    marginBottom: 8,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeContainer: {
    marginBottom: 16,
  },
  timeColumn: {
    marginBottom: 14,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  timeSlots: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  timeSlot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    minWidth: 58,
    alignItems: 'center',
    borderWidth: 1,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookedLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
  },
  notesInput: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 80,
    padding: 12,
  },
  notesTextInput: {
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  totalValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  bookBtnWrapper: {
    marginTop: 24,
    borderRadius: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  bookBtnArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
