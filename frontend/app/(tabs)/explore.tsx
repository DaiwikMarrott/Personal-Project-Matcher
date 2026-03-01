/**
 * Explore/Discover Screen
 * Search and browse all projects
 */
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, getRecommendedProjects } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ExploreScreen() {
  const router = useRouter();
  const { user, checkProfileExists } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortByMatch, setSortByMatch] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    getUserProfile();
    loadProjects();
  }, [user]);

  useEffect(() => {
    if (sortByMatch && userProfileId) {
      loadProjects();
    }
  }, [sortByMatch]);

  const getUserProfile = async () => {
    if (user) {
      try {
        const { exists, profile } = await checkProfileExists(user.id);
        if (exists && profile) {
          setUserProfileId(profile.id);
        }
      } catch (error) {
        console.error('Error getting profile:', error);
      }
    }
  };

  useEffect(() => {
    // Filter projects based on search query
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          (project.tags && project.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    try {
      let projectData: any[] = [];
      
      if (sortByMatch && userProfileId) {
        // Load projects sorted by match score
        const result = await getRecommendedProjects(userProfileId, 100);
        if (result.data) {
          projectData = result.data;
        }
      } else {
        // Load all open projects
        const result = await getProjects({ status: 'open', limit: 50 });
        if (result.data) {
          projectData = result.data;
        }
      }
      
      // Filter out user's own projects
      if (userProfileId) {
        projectData = projectData.filter(project => project.owner_id !== userProfileId);
      }
      
      setProjects(projectData);
      setFilteredProjects(projectData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.brandTitle}>Projects Matcher</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor="#a8a29e"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sort Toggle */}
      {userProfileId && (
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, !sortByMatch && styles.sortButtonActive]}
            onPress={() => setSortByMatch(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortButtonText, !sortByMatch && styles.sortButtonTextActive]}>
              All Projects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortByMatch && styles.sortButtonActive]}
            onPress={() => setSortByMatch(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortButtonText, sortByMatch && styles.sortButtonTextActive]}>
              ✨ Best Matches
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <View>
        <Text style={styles.resultsText}>
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
        </Text>

        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No projects found</Text>
          </View>
        ) : (
          <View style={styles.projectGrid}>
            {filteredProjects.map((project) => (
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
                        {project.tags.slice(0, 3).map((tag: string, index: number) => (
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
                    {sortByMatch && project.similarity !== undefined && (
                      <Text style={styles.matchScore}>
                        {Math.round((project.similarity || 0) * 100)}% Match
                      </Text>
                    )}
                </View>
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
  container: {
    flex: 1,
    backgroundColor: '#e6f7ed',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1c1917',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#78716c',
    marginBottom: 20,
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
    justifyContent: 'space-between',
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
    width: '23.5%',
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
  sortContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sortButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78716c',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  matchScore: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
});
