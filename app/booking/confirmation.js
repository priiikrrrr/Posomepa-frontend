import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { bookingsAPI, paymentsAPI } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import Button from '../../src/components/Button';
import { Image } from 'react-native';
import { format } from 'date-fns';
import { useThemeColors } from '../../src/utils/theme';

const TERMS_TEXT = "By proceeding with this booking, I acknowledge that PosomePa serves solely as a platform connecting property owners and guests. I understand that PosomePa does not intervene in or bear responsibility for any disputes arising from this booking. Any legal matters shall be resolved directly between the property owner and the guest.";

export default function ConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsAPI.getById(id).then(res => res.data),
  });

  // Auto-refresh booking status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [id, queryClient]);

  const createOrderMutation = useMutation({
    mutationFn: paymentsAPI.createOrder,
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: paymentsAPI.verify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      Alert.alert('Success', 'Payment successful! Your booking is confirmed.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Payment verification failed');
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: bookingsAPI.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      Alert.alert('Success', 'Booking cancelled successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
    },
  });

  const requestCancellationMutation = useMutation({
    mutationFn: (bookingId) => bookingsAPI.requestCancellation(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      Alert.alert(
        'Request Submitted',
        'Your cancellation request has been submitted. Admin will review and process your refund.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit cancellation request');
    },
  });

  const handlePayment = async () => {
    if (!booking) return;
    
    setProcessing(true);
    try {
      const { data } = await createOrderMutation.mutateAsync({ bookingId: booking._id });
      
      const razorpayOrderId = data.orderId;
      
      verifyPaymentMutation.mutate({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: 'pay_' + Date.now(),
        razorpay_signature: 'test_signature',
        bookingId: booking._id,
      });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Payment initiation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            cancelBookingMutation.mutate(booking._id);
          }
        },
      ]
    );
  };

  const handleRequestCancellation = () => {
    Alert.alert(
      'Request Cancellation',
      'Are you sure? If approved by admin and booking is more than 2 hours away, you will receive a refund.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Request Cancellation',
          style: 'destructive',
          onPress: () => requestCancellationMutation.mutate(booking._id)
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load booking</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'requested':
        return { bg: '#FEF3C7', text: '#F59E0B' };
      case 'confirmed':
        return { bg: '#D1FAE5', text: '#10B981' };
      case 'completed':
        return { bg: '#DBEAFE', text: '#3B82F6' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#EF4444' };
      case 'cancellation_requested':
        return { bg: '#FEF3C7', text: '#F59E0B' };
      default:
        return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  const statusStyle = getStatusStyle(booking.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1E1B4B' : '#8B5CF6' }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/bookings')} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Text style={styles.headerSubtitle}>{booking.status?.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.spaceRow}>
            <Image
              source={{ uri: booking.propertyDeleted 
                ? 'https://placehold.co/100x100/8B5CF6/ffffff?text=N'
                : booking.space?.images?.[0] }}
              style={styles.spaceImage}
            />
            <View style={styles.spaceInfo}>
              <Text style={[styles.spaceTitle, { color: colors.textPrimary }]}>
                {booking.propertyDeleted ? booking.propertyTitle : booking.space?.name || booking.space?.title}
              </Text>
              <Text style={[styles.spaceLocation, { color: colors.textLight }]}>
                {booking.propertyDeleted ? booking.propertyLocation : booking.space?.location?.city}
              </Text>
              {booking.propertyDeleted && (
                <View style={[styles.statusBadgeContainer, { marginTop: 4 }]}>
                  <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#dc2626' }]}>
                      PROPERTY DELETED
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.statusBadgeContainer}>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                    {booking.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Booking Info - Gradient Card */}
        <LinearGradient
          colors={isDark ? ['#1e1040', '#2d1870'] : ['#7C3AED', '#9333EA']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.infoCard}
        >
          <Text style={styles.infoCardTitle}>Booking Info</Text>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{format(new Date(booking.date), 'MMMM dd, yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{booking.startTime} - {booking.endTime}</Text>
          </View>
          {booking.notes && (
            <View style={styles.row}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{booking.notes}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Payment - Gradient Card */}
        <LinearGradient
          colors={isDark ? ['#1e1040', '#2d1870'] : ['#7C3AED', '#9333EA']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.infoCard}
        >
          <Text style={styles.infoCardTitle}>Payment</Text>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoAmount}>₹{booking.amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#fff' }]}>
                {booking.paymentStatus?.toUpperCase()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {booking.paymentStatus === 'paid' && (booking.space?.owner || booking.propertyHostId) && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Host Contact</Text>
            </View>
            <View style={[styles.hostCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.hostAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={styles.hostInfo}>
                <Text style={[styles.hostName, { color: colors.textPrimary }]}>
                  {booking.space?.owner?.name || booking.propertyHostId?.name || 'Host'}
                </Text>
                {(booking.space?.owner?.phone || booking.propertyHostId?.phone) && (
                  <View style={styles.hostPhoneRow}>
                    <Ionicons name="call-outline" size={14} color={colors.success} />
                    <Text style={[styles.hostPhone, { color: colors.textLight }]}>
                      {booking.space?.owner?.phone || booking.propertyHostId?.phone}
                    </Text>
                  </View>
                )}
                {(booking.space?.owner?.email || booking.propertyHostId?.email) && (
                  <View style={styles.hostPhoneRow}>
                    <Ionicons name="mail-outline" size={14} color={colors.primary} />
                    <Text style={[styles.hostPhone, { color: colors.textLight }]}>
                      {booking.space?.owner?.email || booking.propertyHostId?.email}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
          <>
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
            
            <TouchableOpacity
              onPress={handlePayment}
              disabled={!termsAccepted || processing}
              activeOpacity={0.88}
              style={styles.payBtnWrapper}
            >
              <LinearGradient
                colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.payBtn, (!termsAccepted || processing) && { opacity: 0.5 }]}
              >
                <Text style={styles.payBtnText}>
                  {processing ? 'Processing...' : 'Pay Now'}
                </Text>
                <View style={styles.payBtnArrow}>
                  <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            {!termsAccepted && (
              <Text style={[styles.termsHint, { color: colors.textLight }]}>Please accept T&C to proceed</Text>
            )}
          </>
        )}

        {booking.status === 'requested' && booking.paymentStatus === 'pending' && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelBookingMutation.isPending}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>
              {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        )}

        {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
          <TouchableOpacity
            onPress={handleRequestCancellation}
            disabled={requestCancellationMutation.isPending}
            style={[styles.cancelBtn, { borderColor: '#F59E0B' }]}
          >
            <Text style={[styles.cancelBtnText, { color: '#F59E0B' }]}>
              {requestCancellationMutation.isPending ? 'Submitting...' : 'Request Cancellation'}
            </Text>
          </TouchableOpacity>
        )}

        {booking.status === 'cancellation_requested' && (
          <View style={[styles.cancelBtn, { 
            borderColor: '#F59E0B', 
            backgroundColor: '#FEF3C7',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }]}>
            <Ionicons name="time-outline" size={16} color="#F59E0B" />
            <Text style={[styles.cancelBtnText, { color: '#F59E0B' }]}>
              Cancellation Under Review
            </Text>
          </View>
        )}

        {booking.status === 'cancelled' && booking.paymentStatus === 'refunded' && (
          <View style={[styles.cancelBtn, { 
            borderColor: '#10B981', 
            backgroundColor: '#D1FAE5',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={[styles.cancelBtnText, { color: '#10B981' }]}>
              Booking Cancelled — Refund Initiated
            </Text>
          </View>
        )}

        {booking.status === 'cancelled' && booking.paymentStatus === 'paid' && (
          <View style={[styles.cancelBtn, { 
            borderColor: '#EF4444', 
            backgroundColor: '#FEE2E2',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }]}>
            <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
            <Text style={[styles.cancelBtnText, { color: '#EF4444' }]}>
              Booking Cancelled — No Refund
            </Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  spaceRow: {
    flexDirection: 'row',
  },
  spaceImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  spaceInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  spaceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  spaceLocation: {
    fontSize: 13,
    marginBottom: 8,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
  infoCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  infoValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  infoAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  payBtnWrapper: {
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  payBtnArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
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
  termsHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  hostPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hostPhone: {
    fontSize: 12,
    marginLeft: 6,
  },
});
