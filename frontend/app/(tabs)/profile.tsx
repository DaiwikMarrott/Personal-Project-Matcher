/**
 * Profile Tab Screen
 * View user profile with skills, projects, and settings
 */
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getProjects } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileTabScreen() {
  const { user, signOut, checkProfileExists } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load profile
      const { exists, profile: userProfile } = await checkProfileExists(user.id);
      
      if (!exists || !userProfile) {
        router.replace('/create-profile');
        return;
      }

      setProfile(userProfile);

      // Load user's projects
      const result = await getProjects({ limit: 50 });
      if (result.data) {
        const myProjects = result.data.filter((p: any) => p.owner_id === userProfile.id);
        setUserProjects(myProjects);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/landing');
  };

  const openURL = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Profile not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/create-profile')}
        >
          <Text style={styles.buttonText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      {/* Green Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.headerTitle}>Profile</Text>
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            {profile.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>
              {profile.first_name} {profile.last_name}
            </Text>
            {profile.major && (
              <Text style={styles.subtitle}>{profile.major}</Text>
            )}
          </View>
        </View>

        {/* Social Links */}
        {profile.urls && Object.keys(profile.urls).length > 0 && (
          <View style={styles.socialLinks}>
            {profile.urls.github && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openURL(profile.urls.github)}
              >
                <Text style={styles.socialText}>GitHub</Text>
              </TouchableOpacity>
            )}
            {profile.urls.linkedin && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openURL(profile.urls.linkedin)}
              >
                <Text style={styles.socialText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/profile-edit')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Skills Section */}
      {profile.skills && profile.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.tagContainer}>
            {profile.skills.map((skill: string, index: number) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Interests Section */}
      {profile.interests && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <Text style={styles.sectionText}>{profile.interests}</Text>
        </View>
      )}

      {/* Projects Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Projects ({userProjects.length})</Text>
        {userProjects.length === 0 ? (
          <Text style={styles.emptyText}>No projects yet</Text>
        ) : (
          <View style={styles.projectList}>
            {userProjects.map((project) => (
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
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectStatus}>{project.status || 'open'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7ed',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#10B981',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
    padding: 20,
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 32,
    padding: 40,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#065f46',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1c1917',
    marginBottom: 4,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#78716c',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  editButton: {
    backgroundColor: '#f5f5f4',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1c1917',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  sectionText: {
    fontSize: 16,
    color: '#57534e',
    lineHeight: 24,
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  skillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  projectList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#f5f5f4',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e7e5e4',
  },
  projectImageContainer: {
    width: '100%',
    height: 180,
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
    fontSize: 72,
    opacity: 0.5,
  },
  projectInfo: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1917',
    flex: 1,
  },
  projectStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    textTransform: 'capitalize',
    backgroundColor: '#e7e5e4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#78716c',
    fontWeight: '500',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
});
