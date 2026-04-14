import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../../src/api/client';
import PageHeader from '../../src/components/PageHeader';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemeColors, spacing, borderRadius, shadows } from '../../src/utils/theme';

export default function HostMessages() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['hostMessages'],
    queryFn: () => messagesAPI.getHostMessages().then(res => res.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => messagesAPI.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hostMessages'] }),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }) => messagesAPI.reply(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostMessages'] });
      setReplyText('');
      setShowReplyInput(false);
      Alert.alert('Success', 'Reply sent');
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send reply');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => messagesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostMessages'] });
      setSelectedMessage(null);
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete');
    },
  });

  const handleMessagePress = (message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markReadMutation.mutate(message._id);
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }
    if (replyText.length > 200) {
      Alert.alert('Error', 'Reply must be under 200 characters');
      return;
    }
    
    const SOCIAL_MEDIA_ABBREVS = /ig|wa|wp|tg|sc|tt|fb|x\b|yt/i;
    if (SOCIAL_MEDIA_ABBREVS.test(replyText)) {
      Alert.alert(
        'Message Not Allowed',
        'Social media abbreviations (ig, wa, wp, tg, sc, tt, fb, x, yt) are not allowed.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    replyMutation.mutate({ id: selectedMessage._id, content: replyText });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(selectedMessage._id) },
      ]
    );
  };

  const messages = data?.messages || [];
  const unreadCount = data?.unreadCount || 0;

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

  const isThreadClosed = (message) => {
    if (!message.closedAt) return false;
    return new Date() > new Date(message.closedAt);
  };

  const canHostReply = (message) => {
    if (isThreadClosed(message)) return false;
    if (!message.replies || message.replies.length === 0) return true;
    const lastReply = message.replies[message.replies.length - 1];
    return lastReply.sender._id !== message.receiver._id;
  };

  const getTimeRemaining = (closedAt) => {
    if (!closedAt) return null;
    const now = new Date();
    const closeTime = new Date(closedAt);
    const diff = closeTime - now;
    if (diff <= 0) return 'Thread closed';
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m left`;
    }
    return `${minutes}m left`;
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
    const sender = selectedMessage.sender;
    const closed = isThreadClosed(selectedMessage);
    const canReply = canHostReply(selectedMessage);

    return (
      <View style={styles.container}>
        <PageHeader
          title="Message"
          subtitle={property?.title || 'Property'}
          showBack={true}
          onBack={() => setSelectedMessage(null)}
          rightAction={
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          }
        />

        <KeyboardAvoidingView
          style={styles.threadContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView style={styles.threadScroll} contentContainerStyle={styles.threadContent}>
            <View style={styles.propertyInfo}>
              <Image
                source={{ uri: property?.images?.[0] || 'https://placehold.co/60x60/8B5CF6/ffffff?text=Property' }}
                style={styles.propertyImage}
              />
              <View style={styles.propertyDetails}>
                <Text style={styles.propertyTitle} numberOfLines={1}>{property?.title}</Text>
                <Text style={styles.propertyCity}>{property?.location?.city}</Text>
              </View>
              {closed && (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedBadgeText}>Closed</Text>
                </View>
              )}
            </View>

            <View style={styles.threadMetaRow}>
              {selectedMessage.closedAt && !closed && (
                <View style={styles.timerBadge}>
                  <Ionicons name="time-outline" size={14} color="#F59E0B" />
                  <Text style={styles.timerText}>
                    {getTimeRemaining(selectedMessage.closedAt)}
                  </Text>
                </View>
              )}
              
              <View style={[styles.threadInfoPill, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="chatbubbles-outline" size={12} color={colors.primary} />
                <Text style={[styles.threadInfoText, { color: colors.primary }]}>
                  Thread {selectedMessage.threadsUsed || 1} of 2
                </Text>
              </View>
            </View>

            {closed && (
              <View style={styles.closedNotice}>
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
                <Text style={styles.closedNoticeText}>
                  This thread has ended. User may start a new conversation if they have remaining threads.
                </Text>
              </View>
            )}

            <View style={styles.messageThread}>
              <View style={[styles.messageBubble, styles.originalMessage]}>
                <View style={styles.senderInfo}>
                  <View style={styles.senderAvatar}>
                    <Text style={styles.senderInitial}>{sender?.name?.[0]?.toUpperCase() || 'U'}</Text>
                  </View>
                  <Text style={styles.senderName}>{sender?.name || 'User'}</Text>
                </View>
                <Text style={styles.messageText}>{selectedMessage.content}</Text>
                <Text style={styles.messageTime}>{formatTime(selectedMessage.createdAt)}</Text>
              </View>

              {selectedMessage.replies?.map((reply, idx) => (
                <View key={idx} style={[styles.messageBubble, styles.replyBubble]}>
                  <Text style={styles.replyText}>{reply.content}</Text>
                  <Text style={styles.messageTime}>{formatTime(reply.timestamp)}</Text>
                </View>
              ))}

              {closed && (
                <View style={styles.threadClosedBanner}>
                  <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                  <Text style={styles.threadClosedText}>
                    Thread closed. User must start new conversation.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {closed ? (
            <View style={styles.closedFooter}>
              <Text style={styles.closedFooterText}>Thread closed</Text>
            </View>
          ) : showReplyInput ? (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Type your reply..."
                placeholderTextColor={colors.textLight}
              maxLength={200}
              multiline
            />
            <Text style={styles.charCount}>{replyText.length}/200</Text>
            <Text style={[styles.msgHint, { color: colors.textLight }]}>Keep replies property-related. Contact info not allowed.</Text>
              <View style={styles.replyActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => { setShowReplyInput(false); setReplyText(''); }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
                  onPress={handleReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : !canReply ? (
            <View style={styles.waitingFooter}>
              <Text style={styles.waitingFooterText}>
                {selectedMessage.replies?.length > 0 
                  ? 'Waiting for user to send another message...'
                  : 'Waiting for user message...'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setShowReplyInput(true)}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Messages"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'Their doubts, your replies'}
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.messagesList}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Their doubts, your replies</Text>
          </View>
        ) : (
          messages.map((message) => (
            <TouchableOpacity
              key={message._id}
              style={[styles.messageCard, !message.read && styles.unreadCard]}
              onPress={() => handleMessagePress(message)}
            >
              <View style={styles.messageHeader}>
                <View style={styles.senderAvatar}>
                  <Text style={styles.senderInitial}>{message.sender?.name?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
                <View style={styles.messageInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.senderName}>{message.sender?.name || 'User'}</Text>
                    {!message.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.propertyName} numberOfLines={1}>
                    Re: {message.property?.title || 'Property'}
                  </Text>
                </View>
                <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
              </View>
              <Text style={styles.previewText} numberOfLines={2}>{message.content}</Text>
              {message.replies?.length > 0 && (
                <View style={styles.replyBadge}>
                  <Ionicons name="chatbubble-ellipses" size={12} color={colors.primary} />
                  <Text style={styles.replyBadgeText}>{message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
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
  messagesList: {
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
  messageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  messageInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  propertyName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  previewText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  replyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  replyBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  threadContainer: {
    flex: 1,
  },
  threadScroll: {
    flex: 1,
  },
  threadContent: {
    padding: spacing.md,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
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
  messageBubble: {
    maxWidth: '80%',
    marginBottom: spacing.md,
  },
  originalMessage: {
    alignSelf: 'flex-start',
  },
  replyBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.xs,
    padding: spacing.md,
    marginLeft: 40,
  },
  replyText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  replyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  replyInputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
  },
  replyInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  msgHint: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  timerText: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
  },
  threadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  threadInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  threadInfoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  closedNoticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  closedBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  closedBadgeText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  threadClosedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  threadClosedText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  closedFooter: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closedFooterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  waitingFooter: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  waitingFooterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
