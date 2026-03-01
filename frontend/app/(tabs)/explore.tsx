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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
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
                <View style={styles.projectCardContent}>
                  <View style={styles.projectThumbnail}>
                    {project.project_image_url ? (
                      <Image
                        source={{ uri: project.project_image_url }}
                        style={styles.thumbnailImage}
                      />
                    ) : (
                      <Text style={styles.thumbnailText}>📁</Text>
                    )}
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
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
                      <Text style={styles.projectDescription} numberOfLines={2}>
                        {project.description}
                      </Text>
                    )}
                    {sortByMatch && project.similarity !== undefined && (
                      <Text style={styles.matchScore}>
                        {Math.round((project.similarity || 0) * 100)}% Match
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
  },
  searchContainer: {
    padding: 20,
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
    paddingTop: 10,
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
    gap: 16,
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
  },
  projectCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  projectThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  thumbnailText: {
    fontSize: 28,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  projectDescription: {
    fontSize: 16,
    color: '#57534e',
    lineHeight: 24,
    fontWeight: '500',
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
