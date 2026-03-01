/**
 * Notifications Screen
 * View all notifications and manage them
 */
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getProject, Notification } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, checkProfileExists } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  // Load notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [user])
  );

  const loadNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user profile
      const { exists, profile } = await checkProfileExists(user.id);
      if (!exists || !profile) {
        console.log('[Notifications] No profile found');
        setLoading(false);
        return;
      }

      setUserProfile(profile);

      // Load notifications
      const result = await getNotifications(profile.id);
      if (result.data) {
        setNotifications(result.data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (navigatingId === notification.id) return;
    try {
      setNavigatingId(notification.id);

      // Mark as read if unread
      if (!notification.read) {
        await markNotificationRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }

      // Route based on notification type
      if (notification.notification_type === 'interest') {
        // Owner reviews the join request
        router.push({
          pathname: '/request-review',
          params: { notificationId: notification.id },
        });
      } else if (notification.notification_type === 'approved' && notification.reference_id) {
        // Requester opens their approved chat
        router.push({
          pathname: '/chat',
          params: {
            chatId: notification.reference_id,
            projectTitle: notification.project_title || '',
            projectId: notification.project_id || '',
            otherName: `${notification.sender_first_name || ''} ${notification.sender_last_name || ''}`.trim(),
            otherProfilePic: notification.sender_profile_picture_url || '',
          },
        });
      } else if (notification.project_id) {
        // denied or generic → show project detail
        const result = await getProject(notification.project_id);
        if (result.data) {
          router.push({
            pathname: '/project-detail',
            params: { projectData: JSON.stringify(result.data) },
          });
        } else {
          console.error('Failed to fetch project:', result.error);
        }
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    } finally {
      setNavigatingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userProfile) return;

    try {
      const result = await markAllNotificationsRead(userProfile.id);
      if (result.data) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        Alert.alert('Success', 'All notifications marked as read');
      } else {
        Alert.alert('Error', result.error || 'Failed to mark notifications as read');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const renderNotification = (notification: Notification) => {
    const timeAgo = getTimeAgo(notification.created_at);
    const isUnread = !notification.read;

    return (
      <TouchableOpacity
        key={notification.id}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(notification)}
        disabled={navigatingId === notification.id}
        style={[styles.notificationCard, isUnread && styles.unreadNotification, navigatingId === notification.id && { opacity: 0.6 }]}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {notification.sender_profile_picture_url ? (
            <Image
              source={{ uri: notification.sender_profile_picture_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {`${notification.sender_first_name?.[0] || ''}${notification.sender_last_name?.[0] || ''}`.toUpperCase()}
              </Text>
            </View>
          )}
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {notification.notification_type === 'interest'
              ? '💡 Project Interest'
              : notification.notification_type === 'approved'
              ? '✅ Request Approved'
              : notification.notification_type === 'denied'
              ? '❌ Request Declined'
              : '📩 Notification'}
          </Text>
          <Text style={styles.notificationMessage}>
            <Text style={styles.senderName}>
              {notification.sender_first_name} {notification.sender_last_name}
            </Text>
            {notification.notification_type === 'interest'
              ? ` is interested in your project "${notification.project_title}"`
              : notification.notification_type === 'approved'
              ? ` approved your request to join "${notification.project_title}"`
              : notification.notification_type === 'denied'
              ? ` declined your request to join "${notification.project_title}"`
              : notification.message || ' sent you a notification'
            }
          </Text>
          {!!notification.message && (
            <Text style={styles.customMessage}>"{notification.message}"</Text>
          )}
          <Text style={styles.timeStamp}>{timeAgo}</Text>
        </View>

        {/* Arrow */}
        <IconSymbol size={16} name="chevron.right" color="#78716c" />
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMilliseconds = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconSymbol size={22} name="bell.fill" color="#fff" />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 44 }} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        {/* Stats */}
        {notifications.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsText}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && (
                <Text style={styles.unreadStats}> • {unreadCount} unread</Text>
              )}
            </Text>
          </View>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              When someone expresses interest in your projects, you'll see notifications here.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotification)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7ed',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#10B981',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534e',
    textAlign: 'center',
  },
  unreadStats: {
    color: '#10B981',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
  },
  unreadNotification: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: '#10B981',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#1c1917',
    marginBottom: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  senderName: {
    fontWeight: '700',
    color: '#10B981',
  },
  customMessage: {
    fontSize: 13,
    color: '#57534e',
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 18,
  },
  timeStamp: {
    fontSize: 12,
    color: '#78716c',
    fontWeight: '500',
  },
});