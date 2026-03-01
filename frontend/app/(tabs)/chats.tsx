/**
 * Chats Tab
 * Lists all active conversations for the current user.
 */
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserChats, Chat } from '@/services/api';

export default function ChatsScreen() {
  const router = useRouter();
  const { user, checkProfileExists } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [user])
  );

  const loadChats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { profile } = await checkProfileExists(user.id);
      if (!profile) {
        setLoading(false);
        return;
      }
      setProfileId(profile.id);
      const result = await getUserChats(profile.id);
      if (result.data) {
        setChats(result.data.chats);
      }
    } catch (err) {
      console.error('[Chats] Error loading:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
    >
      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            When a project owner approves your request, a chat will appear here.
          </Text>
        </View>
      ) : (
        chats.map((chat) => {
          const other = chat.other_participant;
          const initials = `${other?.first_name?.[0] || ''}${other?.last_name?.[0] || ''}`.toUpperCase();
          const hasUnread = (chat.unread_count ?? 0) > 0;

          return (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/chat',
                  params: {
                    chatId: chat.id,
                    projectTitle: chat.project_title || '',
                    projectId: chat.project_id || '',
                    otherName: `${other?.first_name || ''} ${other?.last_name || ''}`.trim(),
                    otherProfileId: other?.id || '',
                    otherProfilePic: other?.profile_picture_url || '',
                  },
                })
              }
            >
              {/* Avatar */}
              <View style={styles.avatarSlot}>
                {other?.profile_picture_url ? (
                  <Image source={{ uri: other.profile_picture_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                {hasUnread && <View style={styles.unreadDot} />}
              </View>

              {/* Text */}
              <View style={styles.chatInfo}>
                <View style={styles.chatRow}>
                  <Text style={[styles.chatName, hasUnread && styles.chatNameBold]} numberOfLines={1}>
                    {other?.first_name} {other?.last_name}
                  </Text>
                  <Text style={styles.chatTime}>
                    {formatTime(chat.last_message?.created_at || chat.last_message_at)}
                  </Text>
                </View>
                {chat.project_title ? (
                  <Text style={styles.chatProject} numberOfLines={1}>
                    📁 {chat.project_title}
                  </Text>
                ) : null}
                <Text style={[styles.chatPreview, hasUnread && styles.chatPreviewBold]} numberOfLines={1}>
                  {chat.last_message
                    ? chat.last_message.sender_id === profileId
                      ? `You: ${chat.last_message.content}`
                      : chat.last_message.content
                    : 'No messages yet'}
                </Text>
              </View>

              {/* Unread count */}
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{chat.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f7ed' },
  content: { padding: 12, gap: 8, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e6f7ed' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1c1917' },
  emptySub: { fontSize: 14, color: '#78716c', textAlign: 'center', paddingHorizontal: 24 },

  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  avatarSlot: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#059669' },
  unreadDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },

  chatInfo: { flex: 1, gap: 2 },
  chatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '500', color: '#1c1917', flex: 1 },
  chatNameBold: { fontWeight: '700' },
  chatTime: { fontSize: 12, color: '#a8a29e' },
  chatProject: { fontSize: 12, color: '#059669', fontWeight: '500' },
  chatPreview: { fontSize: 13, color: '#78716c' },
  chatPreviewBold: { color: '#1c1917', fontWeight: '600' },

  unreadBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
