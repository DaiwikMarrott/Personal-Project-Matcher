/**
 * Request Review Screen
 * Project owners see the requester's full profile + their project summary,
 * then Approve or Deny the join request.
 */
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  getRequestDetails,
  approveRequest,
  denyRequest,
  RequestDetails,
} from '@/services/api';

export default function RequestReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, checkProfileExists } = useAuth();
  const [details, setDetails] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [acting, setActing] = useState<'approve' | 'deny' | null>(null);

  const notificationId = Array.isArray(params.notificationId)
    ? params.notificationId[0]
    : params.notificationId as string;

  // Resolve ownerId whenever user becomes available
  useEffect(() => {
    if (!user) return;
    checkProfileExists(user.id).then(({ profile }) => {
      if (profile) setOwnerId(profile.id);
    });
  }, [user]);

  // Load notification details once on mount
  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    try {
      if (!notificationId) {
        setLoading(false);
        return;
      }

      const result = await getRequestDetails(notificationId);
      if (result.data) {
        setDetails(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load request details');
      }
    } catch (err) {
      console.error('[RequestReview] Error loading details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!details || !ownerId || acting) return;
    setActing('approve');
    try {
      const result = await approveRequest(
        details.project.id,
        details.requester.id,
        ownerId,
        notificationId
      );
      if (result.data) {
        Alert.alert(
          '✅ Approved!',
          `${details.requester.first_name} has been notified and a chat has been created.`,
          [
            {
              text: 'Open Chat',
              onPress: () =>
                router.replace({
                  pathname: '/chat',
                  params: {
                    chatId: result.data!.chat_id,
                    projectTitle: details.project.title,
                    otherName: `${details.requester.first_name} ${details.requester.last_name}`,
                    otherProfileId: details.requester.id,
                  },
                }),
            },
            { text: 'Back to Notifications', onPress: () => router.replace('/notifications') },
          ]
        );
      } else {
        const msg = result.error || 'Failed to approve request';
        if (msg.includes('Database tables not set up') || msg.includes('chat_system.sql')) {
          Alert.alert(
            '⚙️ Setup Required',
            'The chat tables haven\'t been created in Supabase yet.\n\nGo to Supabase Dashboard → SQL Editor and run the file:\n\nbackend/migrations/chat_system.sql',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', msg);
        }
      }
    } finally {
      setActing(null);
    }
  };

  const handleDeny = async () => {
    if (!details || !ownerId || acting) return;
    Alert.alert(
      'Deny Request',
      `Are you sure you want to deny ${details.requester.first_name}'s request? They will be notified and cannot re-apply.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: async () => {
            setActing('deny');
            try {
              const result = await denyRequest(
                details.project.id,
                details.requester.id,
                ownerId,
                notificationId
              );
              if (result.data) {
                Alert.alert('Request Denied', `${details.requester.first_name} has been notified.`, [
                  { text: 'OK', onPress: () => router.replace('/notifications') },
                ]);
              } else {
                Alert.alert('Error', result.error || 'Failed to deny request');
              }
            } finally {
              setActing(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Request not found.</Text>
      </View>
    );
  }

  const { requester, project } = details;
  const initials = `${requester.first_name?.[0] || ''}${requester.last_name?.[0] || ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* ── Requester Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>APPLICANT</Text>

          {/* AI Summary at-a-glance */}
          {requester.profile_ai_summary ? (
            <View style={styles.aiSummaryBox}>
              <Text style={styles.aiSummaryLabel}>✨ AI Summary</Text>
              <Text style={styles.aiSummaryText}>{requester.profile_ai_summary}</Text>
            </View>
          ) : null}

          <View style={styles.profileRow}>
            {requester.profile_picture_url ? (
              <Image source={{ uri: requester.profile_picture_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {requester.first_name} {requester.last_name}
              </Text>
              {requester.major ? (
                <Text style={styles.profileSub}>{requester.major}</Text>
              ) : null}
              {requester.experience_level ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{requester.experience_level}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {requester.skills && requester.skills.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Skills</Text>
              <View style={styles.tagRow}>
                {requester.skills.map((skill, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {requester.interests ? (
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Interests</Text>
              <Text style={styles.fieldValue}>{requester.interests}</Text>
            </View>
          ) : null}

          {/* Availability schedule */}
          {requester.availability && typeof requester.availability === 'object' && Object.keys(requester.availability).length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>📅 Availability</Text>
              <View style={styles.tagRow}>
                {Object.entries(requester.availability as Record<string, string>).map(([day, time], i) => (
                  <View key={i} style={styles.scheduleTag}>
                    <Text style={styles.scheduleDay}>{day}</Text>
                    <Text style={styles.scheduleTime}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            {requester.availability_hours_per_week ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>⏱ Hours/week</Text>
                <Text style={styles.metaValue}>{requester.availability_hours_per_week}h</Text>
              </View>
            ) : null}
            {requester.collaboration_style ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>🤝 Style</Text>
                <Text style={styles.metaValue}>{requester.collaboration_style}</Text>
              </View>
            ) : null}
            {requester.project_size_preference ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>📐 Team size</Text>
                <Text style={styles.metaValue}>{requester.project_size_preference}</Text>
              </View>
            ) : null}
            {requester.project_duration_preference ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>📆 Duration pref</Text>
                <Text style={styles.metaValue}>{requester.project_duration_preference}</Text>
              </View>
            ) : null}
          </View>

          {/* Links */}
          {requester.urls && Object.keys(requester.urls).length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Links</Text>
              <View style={styles.linksRow}>
                {requester.urls.github ? (
                  <TouchableOpacity
                    style={styles.linkChip}
                    onPress={() => Linking.openURL(requester.urls!.github!)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkChipText}>🐙 GitHub</Text>
                  </TouchableOpacity>
                ) : null}
                {requester.urls.linkedin ? (
                  <TouchableOpacity
                    style={[styles.linkChip, styles.linkChipBlue]}
                    onPress={() => Linking.openURL(requester.urls!.linkedin!)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.linkChipText, styles.linkChipTextBlue]}>💼 LinkedIn</Text>
                  </TouchableOpacity>
                ) : null}
                {requester.urls.portfolio ? (
                  <TouchableOpacity
                    style={[styles.linkChip, styles.linkChipPurple]}
                    onPress={() => Linking.openURL(requester.urls!.portfolio!)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.linkChipText, styles.linkChipTextPurple]}>🌐 Portfolio</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Project Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOUR PROJECT</Text>
          <Text style={styles.projectTitle}>{project.title}</Text>
          {project.description ? (
            <Text style={styles.projectDescription} numberOfLines={4}>
              {project.description}
            </Text>
          ) : null}
          {project.tags && project.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {project.tags.map((tag: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {(project.duration || project.availability_needed) ? (
            <View style={styles.metaRow}>
              {project.duration ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>📅 Duration</Text>
                  <Text style={styles.metaValue}>{project.duration}</Text>
                </View>
              ) : null}
              {project.availability_needed ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>⏱ Needed</Text>
                  <Text style={styles.metaValue}>{project.availability_needed}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.approveButton, acting && styles.buttonDisabled]}
            onPress={handleApprove}
            activeOpacity={0.8}
            disabled={!!acting}
          >
            {acting === 'approve' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                <Text style={styles.approveButtonText}>Approve Request</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.denyButton, acting && styles.buttonDisabled]}
            onPress={handleDeny}
            activeOpacity={0.8}
            disabled={!!acting}
          >
            {acting === 'deny' ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <IconSymbol size={20} name="xmark.circle.fill" color="#ef4444" />
                <Text style={styles.denyButtonText}>Deny Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f7ed' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e6f7ed' },
  errorText: { fontSize: 16, color: '#78716c' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { width: 40 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1.2,
  },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#059669' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#1c1917' },
  profileSub: { fontSize: 14, color: '#78716c' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#065f46' },

  section: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldValue: { fontSize: 14, color: '#1c1917', lineHeight: 20 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#ecfdf5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: '#059669', fontWeight: '500' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { gap: 2 },
  metaLabel: { fontSize: 11, color: '#a8a29e', fontWeight: '500' },
  metaValue: { fontSize: 13, color: '#1c1917', fontWeight: '600' },

  aiSummaryBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    gap: 4,
  },
  aiSummaryLabel: { fontSize: 11, fontWeight: '700', color: '#059669', letterSpacing: 0.8 },
  aiSummaryText: { fontSize: 13, color: '#374151', lineHeight: 19 },

  scheduleTag: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  scheduleDay: { fontSize: 11, fontWeight: '700', color: '#059669', textTransform: 'uppercase' },
  scheduleTime: { fontSize: 11, color: '#374151' },

  linksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  linkChipBlue: { backgroundColor: '#eff6ff' },
  linkChipTextBlue: { color: '#1d4ed8' },
  linkChipPurple: { backgroundColor: '#faf5ff' },
  linkChipTextPurple: { color: '#7c3aed' },

  projectTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  projectDescription: { fontSize: 14, color: '#57534e', lineHeight: 20 },

  actions: { gap: 12 },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
  },
  approveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  denyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  denyButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
});
