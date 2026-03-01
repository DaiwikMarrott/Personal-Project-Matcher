import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

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
            <ActivityIndicator size="large" color="#4CAF50" />
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
                  <View style={styles.statusBadge}>
                    <ThemedText style={styles.statusText}>{project.status}</ThemedText>
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
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff5252',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptyDescription: {
    opacity: 0.7,
    textAlign: 'center',
  },
  projectsList: {
    marginBottom: 20,
  },
  projectCount: {
    marginBottom: 16,
    opacity: 0.7,
    fontSize: 14,
  },
  projectCard: {
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  projectDescription: {
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#2196F3',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  matchButton: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  troubleshootContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FF9800',
  },
  troubleshootText: {
    fontSize: 13,
    marginBottom: 6,
    opacity: 0.9,
    paddingLeft: 8,
  },
});
