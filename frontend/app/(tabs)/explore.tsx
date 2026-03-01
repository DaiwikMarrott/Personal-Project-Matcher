import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';
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
}

export default function ExploreScreen() {
  const { user } = useAuth();
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
          onPress={() => alert('Project creation coming soon!')}
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
          <View style={styles.projectsList}>
            <ThemedText style={styles.projectCount}>
              {projects.length} Open {projects.length === 1 ? 'Project' : 'Projects'}
            </ThemedText>
            
            {projects.map((project) => (
              <TouchableOpacity 
                key={project.id} 
                style={styles.projectCard}
                onPress={() => alert(`Project: ${project.title}`)}
              >
                <View style={styles.projectHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.projectTitle}>
                    {project.title}
                  </ThemedText>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: project.status === 'open' ? Colors.status.open : Colors.status.closed 
                  }]}>
                    <ThemedText style={styles.statusText}>
                      {project.status === 'open' ? 'OPEN' : 'CLOSED'}
                    </ThemedText>
                  </View>
                </View>
                
                <ThemedText style={styles.projectDescription} numberOfLines={3}>
                  {project.description}
                </ThemedText>
                
                {project.tags && project.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {project.tags.slice(0, 4).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>#{tag}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.projectFooter}>
                  <ThemedText style={styles.matchButton}>
                    🔗 View Matches
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
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
  projectsList: {
    marginBottom: 20,
  },
  projectCount: {
    marginBottom: 16,
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  projectDescription: {
    color: Colors.text.secondary,
    marginBottom: 14,
    lineHeight: 22,
    fontSize: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  matchButton: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
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
