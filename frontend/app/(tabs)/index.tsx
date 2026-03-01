/**
 * Home Screen  
 * Shows personalized project recommendations
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
import { getRecommendedProjects, getProjects, Profile as ApiProfile } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut, checkProfileExists } = useAuth();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      // Check if profile exists
      const { exists, profile: userProfile } = await checkProfileExists(user.id);
      
      if (!exists || !userProfile) {
        console.log('[HomeScreen] No profile found, but user should have been redirected at root level');
        setLoading(false);
        return;
      }

      console.log('[HomeScreen] Profile loaded:', userProfile.id);
      setProfile(userProfile);

      // Load recommended projects
      if (userProfile?.id) {
        const result = await getRecommendedProjects(userProfile.id, 10);
        if (result.data) {
          // Filter out user's own projects
          const filteredProjects = result.data.filter(
            (project: any) => project.owner_id !== userProfile.id
          );
          setRecommendedProjects(filteredProjects);
        }
      } else {
        // Fallback: load all open projects
        const result = await getProjects({ status: 'open', limit: 10 });
        if (result.data) {
          // Filter out user's own projects if profile exists
          const filteredProjects = userProfile?.id 
            ? result.data.filter((project: any) => project.owner_id !== userProfile.id)
            : result.data;
          setRecommendedProjects(filteredProjects);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/landing');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
      {/* Scrollable Header with Profile and Notifications */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects Matcher</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <IconSymbol size={24} name="bell.fill" color="#065f46" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            {profile?.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={styles.profileImage}
              />
            ) : (
              <IconSymbol size={24} name="person.fill" color="#065f46" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      {/* Dashboard Stats */}
      <View style={styles.dashboard}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{recommendedProjects.length}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>🎯</Text>
            <Text style={styles.statLabel}>AI Powered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>💡</Text>
            <Text style={styles.statLabel}>Smart Collab</Text>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>✨ Find the best match for your project</Text>
        <Text style={styles.heroSubtitle}>
          Our algorithm connects you with peers who share your interests and complement your skills.
        </Text>
        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.8}
        >
          <Text style={styles.heroButtonText}>Discover Matches →</Text>
        </TouchableOpacity>
      </View>

      {/* Recommended Projects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Projects</Text>
        
        {recommendedProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No projects yet. Be the first to create one!</Text>
          </View>
        ) : (
          <View style={styles.projectGrid}>
            {recommendedProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/project-detail',
                    params: { projectData: JSON.stringify(project) },
                  });
                }}
              >
                {/* Project Image */}
                <View style={styles.projectImageContainer}>
                  {project.project_image_url ? (
                    <Image
                      source={{ uri: project.project_image_url }}
                      style={styles.projectImage}
                    />
                  ) : (
                    <View style={styles.projectImagePlaceholder}>
                      <Text style={styles.projectImagePlaceholderText}>📁</Text>
                    </View>
                  )}
                </View>
                
                {/* Project Info */}
                <View style={styles.projectInfo}>
                  <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
                    {(project.owner_name || project.owner_first_name) && (
                      <Text style={styles.projectOwner}>
                        by {project.owner_name || `${project.owner_first_name} ${project.owner_last_name || ''}`.trim()}
                      </Text>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <View style={styles.tagContainer}>
                        {project.tags.slice(0, 2).map((tag: string, index: number) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {project.description && (
                      <Text style={styles.projectDescription} numberOfLines={1}>
                        {project.description}
                      </Text>
                    )}
                    {project.similarity_score && (
                      <Text style={styles.matchScore}>
                        {Math.round(project.similarity_score * 100)}% Match
                      </Text>
                    )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#e6f7ed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
  },
  hero: {
    backgroundColor: '#10B981',
    borderRadius: 32,
    padding: 40,
    marginBottom: 48,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#d1fae5',
    marginBottom: 32,
    lineHeight: 28,
    fontWeight: '500',
  },
  heroButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1c1917',
    marginBottom: 24,
    letterSpacing: -1,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#78716c',
    fontWeight: '500',
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
    width: '24.25%',
    marginBottom: 8,
  },
  projectImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#d1fae5',
  },
  projectImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  projectImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
  },
  projectImagePlaceholderText: {
    fontSize: 36,
    opacity: 0.5,
  },
  dashboard: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
    minHeight: 80,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065f46',
    textAlign: 'center',
    lineHeight: 13,
  },
  projectInfo: {
    padding: 10,
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  projectOwner: {
    fontSize: 10,
    fontWeight: '500',
    color: '#78716c',
    marginBottom: 6,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  tag: {
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065f46',
  },
  projectDescription: {
    fontSize: 10,
    color: '#57534e',
    lineHeight: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 32,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
});
