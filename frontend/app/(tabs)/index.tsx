/**
 * Modern Home Screen with Dashboard
 * Features: User stats, recent projects, quick actions
 * Theme: Pastel green, minimalistic design
 */
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : Platform.OS === 'android' 
    ? 'http://10.0.2.2:8000' 
    : 'http://localhost:8000';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, checkProfileExists } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);
  
  // Dashboard data
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    projectsCreated: 0,
    projectsJoined: 0,
    matchesFound: 0,
  });
  const [openProjects, setOpenProjects] = useState<any[]>([]);
  const [closedProjects, setClosedProjects] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Check if user has a profile ONLY after signup
  useEffect(() => {
    const checkProfile = async () => {
      if (user && justSignedUp) {
        const { exists } = await checkProfileExists(user.id);
        
        if (!exists) {
          // Redirect to profile creation only for new signups
          router.push('/create-profile');
        }
        setJustSignedUp(false);
      }
    };

    checkProfile();
  }, [user, justSignedUp]);

  // Load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const updateProjectStatus = async (projectId: string, newStatus: string, ownerId: string) => {
    try {
      console.log(`Updating project ${projectId} status to ${newStatus}`);
      
      const response = await fetch(`${API_URL}/project/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          owner_id: ownerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update project status');
      }

      // Refresh the dashboard
      await loadDashboard();
      
      console.log('Project status updated successfully');
    } catch (err: any) {
      console.error('Error updating project status:', err);
      setError(`Failed to update project: ${err.message}`);
    }
  };

  const loadDashboard = async () => {
    if (!user) return;
    
    setLoadingDashboard(true);
    try {
      // Load profile
      const { exists, profile: userProfile } = await checkProfileExists(user.id);
      if (exists && userProfile) {
        setProfile(userProfile);
      }

      // Load user's projects from backend
      const projectsResponse = await fetch(`${API_URL}/projects?limit=50`);
      if (projectsResponse.ok) {
        const data = await projectsResponse.json();
        const allProjects = data.projects || [];
        
        // Filter projects created by this user
        const userProjects = allProjects.filter((p: any) => p.owner_id === userProfile?.id);
        
        // Separate into open and closed
        const open = userProjects.filter((p: any) => p.status === 'open');
        const closed = userProjects.filter((p: any) => p.status === 'closed');
        
        setOpenProjects(open);
        setClosedProjects(closed);
        
        // Calculate stats
        setStats({
          projectsCreated: userProjects.length,
          projectsJoined: 0,  // You can track this in the database
          matchesFound: allProjects.length - userProjects.length,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleAuth = async () => {
    try {
      setError('');
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setJustSignedUp(true);
        alert('Success! Creating your account...');
      } else {
        await signInWithEmail(email, password);
        setJustSignedUp(false);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  // Logged in view with dashboard
  if (user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.greeting}>Welcome back! 👋</ThemedText>
              <ThemedText style={styles.name}>
                {profile ? `${profile.first_name} ${profile.last_name}` : user.email}
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              {profile?.profile_picture_url ? (
                <Image 
                  source={{ uri: profile.profile_picture_url }} 
                  style={styles.profileImage}
                />
              ) : (
                <ThemedText style={styles.profileInitial}>
                  {profile ? profile.first_name[0] : '👤'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>{stats.projectsCreated}</ThemedText>
              <ThemedText style={styles.statLabel}>Projects Created</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>{stats.matchesFound}</ThemedText>
              <ThemedText style={styles.statLabel}>Available Projects</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>{openProjects.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Active Projects</ThemedText>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/post')}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                  <ThemedText style={styles.actionEmoji}>💡</ThemedText>
                </View>
                <ThemedText style={styles.actionTitle}>Post Project</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/explore')}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.accentLight }]}>
                  <ThemedText style={styles.actionEmoji}>🔍</ThemedText>
                </View>
                <ThemedText style={styles.actionTitle}>Explore</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/profile')}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.info }]}>
                  <ThemedText style={styles.actionEmoji}>👤</ThemedText>
                </View>
                <ThemedText style={styles.actionTitle}>Profile</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Open Projects */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Your Open Projects</ThemedText>
              <TouchableOpacity onPress={() => router.push('/post')}>
                <ThemedText style={styles.seeAll}>+ New</ThemedText>
              </TouchableOpacity>
            </View>
            
            {loadingDashboard ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : openProjects.length > 0 ? (
              openProjects.map((project) => (
                <TouchableOpacity 
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() => router.push(`/project/${project.id}`)}
                >
                  <View style={styles.projectHeader}>
                    <ThemedText style={styles.projectTitle} numberOfLines={1}>
                      {project.title}
                    </ThemedText>
                    <View style={styles.statusActions}>
                      <View style={[styles.statusBadge, { backgroundColor: Colors.status.open }]}>
                        <ThemedText style={styles.statusText}>OPEN</ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          updateProjectStatus(project.id, 'closed', profile?.id);
                        }}
                      >
                        <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ThemedText style={styles.projectDescription} numberOfLines={2}>
                    {project.description}
                  </ThemedText>
                  {project.tags && project.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {project.tags.slice(0, 3).map((tag: string, index: number) => (
                        <View key={index} style={styles.tag}>
                          <ThemedText style={styles.tagText}>{tag}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>No open projects</ThemedText>
                <ThemedText style={styles.emptySubtext}>Post your first project idea!</ThemedText>
              </View>
            )}
          </View>

          {/* Closed Projects */}
          {closedProjects.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Completed Projects</ThemedText>
                <ThemedText style={styles.completedCount}>({closedProjects.length})</ThemedText>
              </View>
              
              {closedProjects.slice(0, 3).map((project) => (
                <TouchableOpacity 
                  key={project.id}
                  style={[styles.projectCard, styles.closedProjectCard]}
                  onPress={() => router.push(`/project/${project.id}`)}
                >
                  <View style={styles.projectHeader}>
                    <ThemedText style={styles.projectTitle} numberOfLines={1}>
                      {project.title}
                    </ThemedText>
                    <View style={styles.statusActions}>
                      <View style={[styles.statusBadge, { backgroundColor: Colors.status.closed }]}>
                        <ThemedText style={styles.statusText}>CLOSED</ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.reopenButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          updateProjectStatus(project.id, 'open', profile?.id);
                        }}
                      >
                        <ThemedText style={styles.reopenButtonText}>Reopen</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ThemedText style={styles.projectDescription} numberOfLines={1}>
                    {project.description}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Login/Signup view
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroGradient}>
            <ThemedText style={styles.heroTitle}>Project Jekyll & Hyde</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Where brilliant minds meet ambitious projects
            </ThemedText>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.primaryLight }]}>
              <ThemedText style={styles.featureEmoji}>🤖</ThemedText>
            </View>
            <ThemedText style={styles.featureTitle}>AI-Powered Matching</ThemedText>
            <ThemedText style={styles.featureText}>
              Find teammates with complementary skills, not duplicates
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.accentLight }]}>
              <ThemedText style={styles.featureEmoji}>🗺️</ThemedText>
            </View>
            <ThemedText style={styles.featureTitle}>Smart Roadmaps</ThemedText>
            <ThemedText style={styles.featureText}>
              Get AI-generated technical roadmaps for your projects
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.info }]}>
              <ThemedText style={styles.featureEmoji}>⚡</ThemedText>
            </View>
            <ThemedText style={styles.featureTitle}>Quick & Easy</ThemedText>
            <ThemedText style={styles.featureText}>
              Create your profile and start collaborating in minutes
            </ThemedText>
          </View>
        </View>

        {/* Auth Form */}
        <View style={styles.authCard}>
          <ThemedText style={styles.authTitle}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Email</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Password</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text.inverse} />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleGoogleSignIn}
          >
            <ThemedText style={styles.secondaryButtonText}>
              Continue with Google
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <ThemedText style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  
  // Header (logged in)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.inverse,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  completedCount: {
    fontSize: 16,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  closedProjectCard: {
    opacity: 0.8,
    borderColor: Colors.border.medium,
  },
  
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  
  // Project Cards
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.inverse,
    textTransform: 'capitalize',
  },
  statusActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  closeButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.inverse,
    textTransform: 'uppercase',
  },
  reopenButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reopenButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.inverse,
    textTransform: 'uppercase',
  },
  projectDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  
  // Hero Section (not logged in)
  hero: {
    marginBottom: 32,
    marginTop: 8,
  },
  heroGradient: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.inverse,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Features
  featuresSection: {
    marginBottom: 32,
    gap: 16,
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
    flex: 1,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  
  // Auth Form
  authCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  errorContainer: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.text.inverse,
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  switchText: {
    color: Colors.primary,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Sign Out Button
  signOutButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    marginTop: 16,
  },
  signOutText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
