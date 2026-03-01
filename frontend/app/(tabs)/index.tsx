/**
 * Home Screen
 * Personalized dashboard with greeting, stats, recommended projects, and own projects.
 */
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Text,
  Image,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  getRecommendedProjects,
  getProjects,
  getProfileStats,
  getDeniedProjectIds,
  getNotifications,
  getUserChats,
  Profile as ApiProfile,
  ProfileStats,
} from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const { user, checkProfileExists } = useAuth();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deniedProjectIds, setDeniedProjectIds] = useState<string[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Load user profile and recommended projects on mount
  useEffect(() => {
    loadData();
  }, [user]);

  // Reload data when screen comes into focus (to show updated projects)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadData();
      }
    }, [loading])
  );

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { exists, profile: userProfile } = await checkProfileExists(user.id);
      if (!exists || !userProfile) { setLoading(false); return; }
      setProfile(userProfile);

      // Parallel fetch everything
      const [deniedResult, statsResult, recommendedResult, myProjectsResult, notifResult, chatsResult] = await Promise.all([
        getDeniedProjectIds(userProfile.id),
        getProfileStats(userProfile.id),
        getRecommendedProjects(userProfile.id, 12),
        getProjects({ owner_id: userProfile.id, status: 'open', limit: 20 }),
        getNotifications(userProfile.id, true),
        getUserChats(userProfile.id),
      ]);

      if (deniedResult.data) setDeniedProjectIds(deniedResult.data.denied_project_ids);
      if (statsResult.data) setStats(statsResult.data);
      if (recommendedResult.data) {
        setRecommendedProjects(
          recommendedResult.data.filter((p: any) => p.owner_id !== userProfile.id)
        );
      }
      if (myProjectsResult.data) setMyProjects(myProjectsResult.data);
      if (notifResult.data) setUnreadNotifCount(notifResult.data.count ?? notifResult.data.notifications?.length ?? 0);
      if (chatsResult.data) {
        const totalUnread = (chatsResult.data.chats as any[]).reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
        setUnreadChatCount(totalUnread);
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const approvedCount = stats?.approved_count ?? 0;
  const deniedCount = stats?.denied_count ?? 0;
  const ratioLabel =
    approvedCount === 0 && deniedCount === 0
      ? '—'
      : deniedCount === 0
      ? `${approvedCount}:0`
      : `${approvedCount}:${deniedCount}`;

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Projects Matcher</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
              <IconSymbol size={22} name="bell.fill" color="#065f46" />
              {unreadNotifCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotifCount > 99 ? '99+' : unreadNotifCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/chats')} activeOpacity={0.7}>
              <IconSymbol size={22} name="bubble.left.and.bubble.right.fill" color="#065f46" />
              {unreadChatCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadChatCount > 99 ? '99+' : unreadChatCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.7}>
              {profile?.profile_picture_url ? (
                <Image source={{ uri: profile.profile_picture_url }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {`${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingHello}>👋 Hello, {firstName} {lastName}!</Text>
          <Text style={styles.greetingSubtitle}>Here's your project dashboard</Text>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statEmoji}>🗂</Text>
            <Text style={styles.statNumber}>{stats?.projects_created ?? '—'}</Text>
            <Text style={styles.statLabel}>Projects{'\n'}Created</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statEmoji}>📬</Text>
            <Text style={styles.statNumber}>{stats?.interactions_this_week ?? '—'}</Text>
            <Text style={styles.statLabel}>Applied{'\n'}This Week</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAmber]}>
            <Text style={styles.statEmoji}>⚖️</Text>
            <Text style={styles.statNumber}>{ratioLabel}</Text>
            <Text style={styles.statLabel}>Approved /{'\n'}Denied</Text>
          </View>                </View>

        {/* ── Recommended Projects ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Recommended For You</Text>

          {recommendedProjects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recommendations yet — fill in your profile to improve matches!</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recommendedProjects.slice(0, 8).map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.recCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: '/project-detail',
                      params: {
                        projectData: JSON.stringify(project),
                        isDenied: deniedProjectIds.includes(project.id) ? '1' : '0',
                      },
                    })
                  }
                >
                  <View style={styles.recImageBox}>
                    {project.project_image_url ? (
                      <Image source={{ uri: project.project_image_url }} style={styles.recImage} />
                    ) : (
                      <View style={styles.recImagePlaceholder}>
                        <Text style={{ fontSize: 28, opacity: 0.45 }}>📁</Text>
                      </View>
                    )}
                    {!!project.similarity_score && (
                      <View style={styles.matchBadge}>
                        <Text style={styles.matchBadgeText}>
                          {Math.round(project.similarity_score * 100)}%
                        </Text>
                      </View>
                    )}
                    {deniedProjectIds.includes(project.id) ? (
                      <View style={styles.deniedBadge}>
                        <Text style={styles.deniedBadgeText}>❌</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.recInfo}>
                    <Text style={styles.recTitle} numberOfLines={2}>{project.title}</Text>
                    {(project.owner_first_name || project.owner_name) ? (
                      <Text style={styles.recOwner}>
                        by {project.owner_name || `${project.owner_first_name} ${project.owner_last_name || ''}`.trim()}
                      </Text>
                    ) : null}
                    {project.tags && project.tags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {project.tags.slice(0, 2).map((tag: string, i: number) => (
                          <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}

              {/* See All button */}
              <TouchableOpacity
                style={styles.seeAllCard}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Text style={styles.seeAllArrow}>→</Text>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* ── My Projects ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🗂 My Projects</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/post')} activeOpacity={0.7}>
              <Text style={styles.newProjectLink}>+ New</Text>
            </TouchableOpacity>
          </View>

          {myProjects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>You haven't created any open projects yet.</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(tabs)/post')}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>Create a Project</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.myProjectsList}>
              {myProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.myProjectRow}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: '/project-detail',
                      params: { projectData: JSON.stringify(project), isDenied: '0' },
                    })
                  }
                >
                  <View style={styles.myProjectImageBox}>
                    {project.project_image_url ? (
                      <Image source={{ uri: project.project_image_url }} style={styles.myProjectImage} />
                    ) : (
                      <View style={styles.myProjectImagePlaceholder}>
                        <Text style={{ fontSize: 20, opacity: 0.45 }}>📁</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.myProjectInfo}>
                    <Text style={styles.myProjectTitle} numberOfLines={1}>{project.title}</Text>
                    {project.description ? (
                      <Text style={styles.myProjectDesc} numberOfLines={2}>{project.description}</Text>
                    ) : null}
                    {project.tags && project.tags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {project.tags.slice(0, 3).map((tag: string, i: number) => (
                          <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <IconSymbol size={16} name="chevron.right" color="#a8a29e" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#e6f7ed' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e6f7ed' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  appTitle: { fontSize: 22, fontWeight: '900', color: '#10B981', letterSpacing: -0.5 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#a7f3d0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#a7f3d0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff', overflow: 'hidden',
  },  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#e6f7ed',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },  avatarImg: { width: '100%', height: '100%', borderRadius: 21 },
  avatarInitials: { fontSize: 15, fontWeight: '800', color: '#065f46' },

  // Greeting
  greetingBlock: { marginBottom: 24 },
  greetingHello: { fontSize: 30, fontWeight: '900', color: '#1c1917', letterSpacing: -0.8, marginBottom: 4 },
  greetingSubtitle: { fontSize: 14, color: '#78716c', fontWeight: '500' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  statCard: {
    flex: 1, borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 10,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  statCardGreen: { backgroundColor: '#d1fae5' },
  statCardBlue: { backgroundColor: '#dbeafe' },
  statCardAmber: { backgroundColor: '#fef3c7' },
  statEmoji: { fontSize: 30 },
  statNumber: { fontSize: 22, fontWeight: '900', color: '#1c1917' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#57534e', textAlign: 'center', lineHeight: 14 },

  // Sections
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1c1917', letterSpacing: -0.4, marginBottom: 14 },
  newProjectLink: { fontSize: 14, fontWeight: '700', color: '#10B981' },

  // Empty state
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 14, color: '#78716c', textAlign: 'center', lineHeight: 20 },
  createButton: {
    backgroundColor: '#10B981', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  createButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Recommended – horizontal scroll
  horizontalScroll: { paddingRight: 4, gap: 12 },
  recCard: {
    width: 160, backgroundColor: '#fff', borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  recImageBox: { width: '100%', height: 100, backgroundColor: '#d1fae5', position: 'relative' },
  recImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  recImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  matchBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#10B981', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  matchBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  deniedBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#fee2e2', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  deniedBadgeText: { fontSize: 10 },
  recInfo: { padding: 10, gap: 4 },
  recTitle: { fontSize: 13, fontWeight: '700', color: '#1c1917', lineHeight: 18 },
  recOwner: { fontSize: 10, color: '#78716c', fontWeight: '500' },

  // See All card
  seeAllCard: {
    width: 80, backgroundColor: '#10B981', borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  seeAllArrow: { fontSize: 28, fontWeight: '800', color: '#fff' },
  seeAllText: { fontSize: 11, fontWeight: '700', color: '#d1fae5' },

  // Tags (shared)
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  tag: {
    backgroundColor: '#d1fae5', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
  },
  tagText: { fontSize: 9, fontWeight: '700', color: '#065f46' },

  // My Projects list
  myProjectsList: { gap: 10 },
  myProjectRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  myProjectImageBox: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: '#d1fae5', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  myProjectImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  myProjectImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  myProjectInfo: { flex: 1, gap: 3 },
  myProjectTitle: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  myProjectDesc: { fontSize: 11, color: '#78716c', lineHeight: 15 },

});
