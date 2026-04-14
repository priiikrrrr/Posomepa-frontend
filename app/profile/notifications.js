import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../../src/api/client';
import PageHeader from '../../src/components/PageHeader';
import Toast from '../../src/components/Toast';
import { useThemeColors, spacing, borderRadius, shadows } from '../../src/utils/theme';

export default function Notifications() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['myMessages'],
    queryFn: () => messagesAPI.getMy().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => messagesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMessages'] });
      setSelectedMessage(null);
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(selectedMessage._id) },
      ]
    );
  };

  const messages = data?.messages || [];

  const isThreadClosed = (message) => {
    if (!message.closedAt) return false;
    return new Date() > new Date(message.closedAt);
  };

  const getTimeRemaining = (closedAt) => {
    if (!closedAt) return null;
    const now = new Date();
    const closeTime = new Date(closedAt);
    const diff = closeTime - now;
    if (diff <= 0) return 'Closed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (selectedMessage) {
    const property = selectedMessage.property;
    const replies = selectedMessage.replies || [];

    return (
      <View style={styles.container}>
        <PageHeader
          title="Notification"
          subtitle={property?.title || 'Property'}
          showBack={true}
          onBack={() => setSelectedMessage(null)}
          rightAction={
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          }
        />

        <ScrollView contentContainerStyle={styles.threadContent}>
          <View style={styles.propertyInfo}>
            <Image
              source={{ uri: property?.images?.[0] || 'https://placehold.co/60x60/8B5CF6/ffffff?text=Property' }}
              style={styles.propertyImage}
            />
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyTitle} numberOfLines={1}>{property?.title}</Text>
              <Text style={styles.propertyCity}>{property?.location?.city}</Text>
            </View>
            {isThreadClosed(selectedMessage) && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>Closed</Text>
              </View>
            )}
          </View>

          <View style={styles.threadMetaRow}>
            {selectedMessage.closedAt && !isThreadClosed(selectedMessage) && (
              <View style={styles.timeRemainingBadge}>
                <Ionicons name="time-outline" size={14} color="#F59E0B" />
                <Text style={styles.timeRemainingText}>
                  {getTimeRemaining(selectedMessage.closedAt)}
                </Text>
              </View>
            )}
            
            <View style={[
              styles.limitPill,
              selectedMessage.threadsRemaining === 0 
                ? { backgroundColor: '#FEE2E2' } 
                : selectedMessage.threadsRemaining === 1
                ? { backgroundColor: '#FEF3C7' }
                : { backgroundColor: '#F0FDF4' }
            ]}>
              <Ionicons 
                name={selectedMessage.threadsRemaining === 0 
                  ? "alert-circle" 
                  : "chatbubbles-outline"} 
                size={12} 
                color={selectedMessage.threadsRemaining === 0 
                  ? '#DC2626' 
                  : selectedMessage.threadsRemaining === 1
                  ? '#D97706'
                  : '#16A34A'} 
              />
              <Text style={[
                styles.limitPillText,
                { color: selectedMessage.threadsRemaining === 0 
                  ? '#DC2626' 
                  : selectedMessage.threadsRemaining === 1
                  ? '#D97706'
                  : '#16A34A' }
              ]}>
                {selectedMessage.threadsRemaining === 0 
                  ? 'No conversations left for this property'
                  : `${selectedMessage.threadsRemaining} of 2 conversations left`
                }
              </Text>
            </View>
          </View>

          {isThreadClosed(selectedMessage) && selectedMessage.threadsRemaining > 0 && (
            <View style={styles.newThreadNotice}>
              <Ionicons name="refresh-circle-outline" size={16} color="#8B5CF6" />
              <Text style={styles.newThreadNoticeText}>
                This thread has ended. You can start a new conversation from the property page.
              </Text>
            </View>
          )}

          {isThreadClosed(selectedMessage) && selectedMessage.threadsRemaining === 0 && (
            <View style={styles.noMoreThreadsNotice}>
              <Ionicons name="lock-closed-outline" size={16} color="#DC2626" />
              <Text style={styles.noMoreThreadsNoticeText}>
                You have used all 2 allowed conversations for this property. No further messaging is possible.
              </Text>
            </View>
          )}

          <View style={styles.messageThread}>
            <View style={[styles.messageBubble, styles.sentMessage]}>
              <Text style={styles.messageLabel}>Your message</Text>
              <Text style={styles.messageText}>{selectedMessage.content}</Text>
              <Text style={styles.messageTime}>{formatTime(selectedMessage.createdAt)}</Text>
            </View>

            {replies.length > 0 ? (
              <View style={[styles.messageBubble, styles.receivedMessage]}>
                <Text style={styles.messageLabel}>Host reply</Text>
                {replies.map((reply, idx) => (
                  <View key={idx} style={styles.replyItem}>
                    <Text style={styles.replyText}>{reply.content}</Text>
                    <Text style={styles.messageTime}>{formatTime(reply.timestamp)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.waitingReply}>
                <Ionicons name="time-outline" size={24} color={colors.textLight} />
                <Text style={styles.waitingText}>Waiting for host's reply...</Text>
              </View>
            )}

            {isThreadClosed(selectedMessage) && (
              <View style={styles.threadClosedBanner}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                <Text style={styles.threadClosedText}>
                  Thread closed. Visit the property page to start a new conversation.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <Toast 
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Notifications"
        subtitle={messages.length > 0 ? `${messages.length} message${messages.length > 1 ? 's' : ''}` : 'Drop your doubts, wait for replies'}
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.notificationsList}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>Drop your doubts, wait for replies</Text>
          </View>
        ) : (
          messages.map((message) => {
            const hasReply = message.replies?.length > 0;
            const closed = isThreadClosed(message);
            return (
              <TouchableOpacity
                key={message._id}
                style={[styles.notificationCard, closed && styles.closedCard]}
                onPress={() => setSelectedMessage(message)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={closed ? 'lock-closed' : hasReply ? 'checkmark-circle' : 'time-outline'}
                      size={24}
                      color={closed ? '#6B7280' : hasReply ? '#16A34A' : colors.textLight}
                    />
                  </View>
                  <View style={styles.notificationInfo}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={[styles.notificationTitle, closed && styles.closedTitle]}>
                        {closed ? 'Thread closed' : hasReply ? 'Host replied!' : 'Message sent'}
                      </Text>
                      {closed && (
                        <View style={styles.closedChip}>
                          <Text style={styles.closedChipText}>New thread needed</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.propertyName} numberOfLines={1}>
                      {message.property?.title || 'Property'}
                    </Text>
                  </View>
                  <Text style={styles.notificationTime}>{formatTime(message.updatedAt)}</Text>
                </View>
                <Text style={[styles.previewText, closed && styles.closedPreview]} numberOfLines={2}>
                  {hasReply
                    ? message.replies[message.replies.length - 1].content
                    : message.content}
                </Text>
                <View style={styles.cardFooter}>
                  <View style={[
                    styles.threadCountBadge,
                    message.threadsRemaining === 0 
                      ? { backgroundColor: '#FEE2E2' }
                      : { backgroundColor: '#EDE9FE' }
                  ]}>
                    <Text style={[
                      styles.threadCountText,
                      { color: message.threadsRemaining === 0 ? '#DC2626' : '#8B5CF6' }
                    ]}>
                      {message.threadsRemaining === 0 
                        ? 'No conversations left'
                        : `${message.threadsRemaining} conversation${message.threadsRemaining !== 1 ? 's' : ''} left`
                      }
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsList: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  closedCard: {
    opacity: 0.7,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.iconBgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closedTitle: {
    color: colors.textLight,
  },
  closedChip: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  closedChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.error,
  },
  propertyName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  previewText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 48,
  },
  closedPreview: {
    color: colors.textLight,
  },
  threadContent: {
    padding: spacing.md,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  closedBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  closedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  timeRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  timeRemainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  threadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  limitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  limitPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  newThreadNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EDE9FE',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  newThreadNoticeText: {
    fontSize: 12,
    color: '#6D28D9',
    flex: 1,
    lineHeight: 18,
  },
  noMoreThreadsNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  noMoreThreadsNoticeText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginLeft: 48,
  },
  threadCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  threadCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  propertyImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  propertyDetails: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  propertyCity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  messageThread: {
    gap: spacing.sm,
  },
  threadClosedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  threadClosedText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    flex: 1,
  },
  messageBubble: {
    maxWidth: '85%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.xs,
    padding: spacing.md,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.xs,
    padding: spacing.md,
    ...shadows.md,
  },
  messageLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
  },
  replyItem: {
    marginBottom: spacing.xs,
  },
  replyText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  waitingReply: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '05',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  waitingText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});
