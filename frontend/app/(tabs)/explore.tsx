import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Platform, Image, TextInput, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import Colors from '@/constants/colors';

const windowWidth = Dimensions.get('window').width;

// Use hardcoded URL for web, env variable for native
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000'; // 10.0.2.2 for Android emulator
};

const API_URL = getApiUrl();

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  owner_id: string;
  project_image_url?: string | null;
  similarity?: number;  // From recommended endpoint
  similarity_score?: number;  // Normalized score for sorting
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByMatch, setSortByMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    checkBackendHealth();
    
    // Get user profile ID for matching
    const getUserProfile = async () => {
      if (user) {
        try {
          console.log('Fetching user profile for:', user.id);
          const response = await fetch(`${API_URL}/profile/check/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Profile check response:', data);
            if (data.exists && data.profile) {
              console.log('Setting userProfileId:', data.profile.id);
              setUserProfileId(data.profile.id);
            } else {
              console.log('User profile does not exist');
              setUserProfileId(null);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };
    
    getUserProfile();
  }, [user]);

  // Refresh projects when screen comes into focus (e.g., after creating a project)
  useFocusEffect(
    useCallback(() => {
      if (user && backendOnline) {
        console.log('Explore screen focused - refreshing projects');
        fetchProjects();
      }
    }, [user, backendOnline])
  );

  const checkBackendHealth = async () => {
    try {
      console.log('Checking backend at:', API_URL);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_URL}/`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setBackendOnline(true);
        fetchProjects();
      } else {
        throw new Error('Backend returned error status');
      }
    } catch (err: any) {
      console.error('Backend health check failed:', err);
      setBackendOnline(false);
      setLoading(false);
      setError('Cannot connect to backend. Make sure it is running at ' + API_URL);
    }
  };

  // Filter and search handler
  useEffect(() => {
    let filtered = [...projects];
    
    // Only show open projects
    filtered = filtered.filter(p => p.status === 'open');
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sort by match score if enabled
    if (sortByMatch && filtered.length > 0) {
      filtered.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
    }
    
    setFilteredProjects(filtered);
  }, [projects, searchQuery, sortByMatch]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching projects from:', `${API_URL}/projects`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let allProjects = [];
      
      // If sort by match is enabled and user has profile, fetch recommended
      if (sortByMatch && userProfileId) {
        const response = await fetch(`${API_URL}/recommended-projects/${userProfileId}?limit=50`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Recommended projects loaded:', data.recommended_projects?.length || 0);
          allProjects = data.recommended_projects || [];
          // Add similarity_score field from similarity
          allProjects = allProjects.map(p => ({ 
            ...p, 
            similarity_score: p.similarity 
          }));
          console.log('First project similarity:', allProjects[0]?.similarity_score);
        }
      } else {
        // Fetch all open projects
        const response = await fetch(`${API_URL}/projects?project_status=open&limit=100`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Projects loaded:', data.count);
        allProjects = data.projects || [];
        
        // Randomize project order when not sorting by match
        allProjects = allProjects.sort(() => Math.random() - 0.5);
        console.log('Projects randomized for default view');
      }
      
      setProjects(allProjects);
      setFilteredProjects(allProjects);
      setBackendOnline(true);
      
      // Log project similarity scores for debugging
      if (sortByMatch && allProjects.length > 0) {
        console.log('=== PROJECT MATCH SCORES ===');
        allProjects.slice(0, 10).forEach((p: any, idx: number) => {
          console.log(`${idx + 1}. ${p.title}: ${p.similarity_score ? Math.round(p.similarity_score * 100) + '%' : 'N/A'}`);
        });
        console.log('===========================');
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      
      if (err.name === 'AbortError') {
        setError('Request timed out. Backend might be slow or not responding.');
      } else if (err.message?.includes('Network request failed')) {
        setError(`Cannot reach backend at ${API_URL}. Is it running?`);
        setBackendOnline(false);
      } else {
        setError(err.message || 'Error loading projects');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              🔍 Explore Projects
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to explore amazing project ideas
            </ThemedText>
          </View>
          
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>🔐</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyText}>
              Please sign in to browse projects
            </ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Create an account on the Home tab to start exploring
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            🔍 Explore Projects
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Find your next collaboration opportunity
          </ThemedText>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, sortByMatch && styles.filterButtonActive]}
            onPress={() => {
              setSortByMatch(!sortByMatch);
              // Refetch when toggling match sorting
              fetchProjects();
            }}
          >
            <ThemedText style={[styles.filterButtonText, sortByMatch && styles.filterButtonTextActive]}>
              {sortByMatch ? '✓ Sorted by Match' : '⭐ Sort by Match'}
            </ThemedText>
          </TouchableOpacity>
          
          {sortByMatch && !userProfileId && (
            <ThemedText style={styles.filterHint}>
              Create a profile to see personalized matches
            </ThemedText>
          )}
        </View>

        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/post')}
        >
          <ThemedText style={styles.createButtonText}>
            ➕ Post Your Project Idea
          </ThemedText>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText style={styles.loadingText}>
              {backendOnline ? 'Loading projects...' : 'Connecting to backend...'}
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorEmoji}>⚠️</ThemedText>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            
            {!backendOnline && (
              <View style={styles.troubleshootContainer}>
                <ThemedText style={styles.troubleshootTitle}>
                  💡 Quick Fix:
                </ThemedText>
                <ThemedText style={styles.troubleshootText}>
                  1. Open a terminal in the backend folder
                </ThemedText>
                <ThemedText style={styles.troubleshootText}>
                  2. Run: uvicorn main:app --reload
                </ThemedText>
                <ThemedText style={styles.troubleshootText}>
                  3. Wait for "Application startup complete"
                </ThemedText>
                <ThemedText style={styles.troubleshootText}>
                  4. Click Retry below
                </ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                setError('');
                checkBackendHealth();
              }}
            >
              <ThemedText style={styles.retryButtonText}>
                🔄 Retry Connection
              </ThemedText>
            </TouchableOpacity>
            
            <ThemedText style={styles.helpText}>
              Backend URL: {API_URL}
            </ThemedText>
            <ThemedText style={styles.helpText}>
              Platform: {Platform.OS}
            </ThemedText>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>{searchQuery ? '🔍' : '📭'}</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyText}>
              {searchQuery ? 'No matching projects' : 'No projects yet'}
            </ThemedText>
            <ThemedText style={styles.emptyDescription}>
              {searchQuery ? 'Try a different search term' : 'Be the first to post a project idea!'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.projectsContainer}>
            <ThemedText style={styles.projectCount}>
              {filteredProjects.length} Open {filteredProjects.length === 1 ? 'Project' : 'Projects'}
              {sortByMatch && ' (Sorted by Match)'}
            </ThemedText>
            
            <View style={styles.projectsGrid}>
              {filteredProjects.map((project) => {
                // Skip projects without valid IDs
                if (!project || !project.id) {
                  console.warn('Skipping project with missing ID in explore:', project);
                  return null;
                }
                
                return (
                <TouchableOpacity 
                  key={project.id} 
                  style={styles.projectCard}
                  onPress={() => {
                    console.log('Navigating to project from explore:', project.id);
                    router.push(`/project/${project.id}`);
                  }}
                >
                  {/* Project Image */}
                  {project.project_image_url ? (
                    <Image 
                      source={{ uri: project.project_image_url }} 
                      style={styles.projectImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.projectImagePlaceholder}>
                      <ThemedText style={styles.projectImageEmoji}>💀</ThemedText>
                    </View>
                  )}
                  
                  {/* Title Overlay */}
                  <View style={styles.projectTitleContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.projectTitle} numberOfLines={2}>
                      {project.title}
                    </ThemedText>
                  </View>
                  
                  {/* Status Badge - Top Right */}
                  <View style={[styles.statusBadge, { 
                    backgroundColor: project.status === 'open' ? Colors.status.open : Colors.status.closed 
                  }]}>
                    <ThemedText style={styles.statusText}>
                      {project.status === 'open' ? 'OPEN' : 'CLOSED'}
                    </ThemedText>
                  </View>
                  
                  {/* Match Badge - Show when sorted by match */}
                  {sortByMatch && project.similarity_score !== undefined && (
                    <View style={[styles.statusBadge, { 
                      backgroundColor: Colors.accent,
                      top: 40,  // Below the status badge
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }]}>
                      <ThemedText style={styles.statusText}>
                        ⭐ {Math.round(project.similarity_score * 100)}% Match
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    paddingRight: 45,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchIcon: {
    position: 'absolute',
    right: 14,
    top: 12,
    fontSize: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterButtonTextActive: {
    color: Colors.text.inverse,
  },
  filterHint: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.text.secondary,
  },
  createButton: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  createButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.text.secondary,
    fontSize: 15,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 32,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyText: {
    marginBottom: 8,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptyDescription: {
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: 15,
  },
  projectsContainer: {
    marginBottom: 20,
  },
  projectCount: {
    marginBottom: 16,
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    width: windowWidth > 768 ? (windowWidth - 120) / 4 : windowWidth > 480 ? (windowWidth - 90) / 3 : (windowWidth - 70) / 2, // 4 tiles on large, 3 on medium, 2 on small
    aspectRatio: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  projectImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  projectImageEmoji: {
    fontSize: 48,
    opacity: 0.6,
  },
  projectTitleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: Colors.text.inverse,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  troubleshootContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text.primary,
  },
  troubleshootText: {
    fontSize: 14,
    marginBottom: 6,
    color: Colors.text.secondary,
    paddingLeft: 8,
  },
});
