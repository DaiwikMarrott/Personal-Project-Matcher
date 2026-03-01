import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import Colors from '@/constants/colors';

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
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    checkBackendHealth();
  }, []);

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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching projects from:', `${API_URL}/projects`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Fetch only open projects for the explore page
      const response = await fetch(`${API_URL}/projects?project_status=open&limit=50`, {
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
      setProjects(data.projects || []);
      setBackendOnline(true);
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
        ) : projects.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyText}>
              No projects yet
            </ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Be the first to post a project idea!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.projectsContainer}>
            <ThemedText style={styles.projectCount}>
              {projects.length} Open {projects.length === 1 ? 'Project' : 'Projects'}
            </ThemedText>
            
            <View style={styles.projectsGrid}>
              {projects.map((project) => (
                <TouchableOpacity 
                  key={project.id} 
                  style={styles.projectCard}
                  onPress={() => router.push(`/project/${project.id}`)}
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
                </TouchableOpacity>
              ))}
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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
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
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    gap: 12,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    width: '100%',
    height: 280,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  statusBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  statusText: {
    color: Colors.text.inverse,
    fontSize: 9.5,
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
