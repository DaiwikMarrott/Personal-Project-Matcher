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
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getProjects } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : Platform.OS === 'android' 
    ? 'http://10.0.2.2:8000' 
    : 'http://localhost:8000';

export default function ProfileTabScreen() {
  const { user, signOut, checkProfileExists } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hyde verdict state
  const [hydeLoading, setHydeLoading] = useState(false);
  const [hydeScript, setHydeScript] = useState('');
  const [showHydeScript, setShowHydeScript] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTalking, setIsTalking] = useState(false);
  const audioRef = useRef<any>(null);
  const talkingAnimation = useRef(new Animated.Value(0)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;
  const typingIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadProfileData();
    
    // Cleanup function
    return () => {
      // Stop and cleanup audio if it exists
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      // Clear typing interval if it exists
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      // Stop animations
      talkingAnimation.stopAnimation();
      rotationAnimation.stopAnimation();
    };
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

  const animateTyping = (text: string, duration: number) => {
    const words = text.split(' ');
    const wordsPerSecond = words.length / duration;
    const msPerWord = 1000 / wordsPerSecond;
    
    setDisplayedText('');
    let currentIndex = 0;
    
    // Clear previous interval if exists
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        typingIntervalRef.current = null;
      }
    }, msPerWord);
    
    typingIntervalRef.current = interval;
  };

  const startTalkingAnimation = () => {
    setIsTalking(true);
    // Mouth movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(talkingAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(talkingAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Rotation animation (alternating clockwise and anticlockwise)
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotationAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: -1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopTalkingAnimation = () => {
    setIsTalking(false);
    talkingAnimation.stopAnimation();
    talkingAnimation.setValue(0);
    rotationAnimation.stopAnimation();
    rotationAnimation.setValue(0);
  };

  const hearMrHyde = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'Profile not loaded');
      return;
    }

    // Cleanup previous audio and animations
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    stopTalkingAnimation();

    let data: any = null;
    try {
      setHydeLoading(true);
      setShowHydeScript(false);
      setDisplayedText('');
      
      console.log('=== HYDE VERDICT START ===');
      console.log('Profile ID:', profile.id);
      console.log('API URL:', `${API_URL}/profile/${profile.id}/hyde-verdict`);
      
      const response = await fetch(`${API_URL}/profile/${profile.id}/hyde-verdict`, {
        method: 'POST',
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      data = await response.json();
      console.log('=== HYDE VERDICT DATA RECEIVED ===');
      console.log('Full data:', data);
      console.log('Script:', data.script);
      console.log('Has audio_base64:', !!data.audio_base64);
      console.log('Audio length:', data.audio_base64?.length);
      console.log('Is roast:', data.is_roast);
      console.log('Error field:', data.error);
      
      if (data.script) {
        setHydeScript(data.script);
        setShowHydeScript(true);
      } else {
        console.warn('No script in response!');
      }

      // Play audio if available
      if (data.audio_base64 && Platform.OS === 'web') {
        console.log('=== AUDIO PLAYBACK START ===');
        console.log('Audio base64 length:', data.audio_base64.length);
        console.log('First 50 chars:', data.audio_base64.substring(0, 50));
        
        try {
          console.log('Creating audio blob...');
          
          // Create audio blob for better compatibility
          const binaryString = atob(data.audio_base64);
          console.log('Binary string length:', binaryString.length);
          
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          console.log('Byte array created, length:', bytes.length);
          
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          console.log('Blob created, size:', blob.size, 'type:', blob.type);
          
          const audioUrl = URL.createObjectURL(blob);
          console.log('Blob URL created:', audioUrl);
          
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          console.log('Audio element created');
          
          // Add event listeners for animations
          audio.addEventListener('loadeddata', () => {
            console.log('✅ Audio loaded successfully, duration:', audio.duration);
            // Start typing animation based on audio duration
            if (data.script && audio.duration > 0) {
              console.log('Starting typing animation...');
              animateTyping(data.script, audio.duration);
            } else {
              console.warn('Cannot start typing - no script or invalid duration');
            }
          });
          
          audio.addEventListener('canplay', () => {
            console.log('Audio can play');
          });
          
          audio.addEventListener('play', () => {
            console.log('Audio is playing');
            startTalkingAnimation();
          });
          
          audio.addEventListener('pause', () => {
            console.log('Audio paused');
            stopTalkingAnimation();
          });
          
          audio.addEventListener('error', (e) => {
            console.error('Audio error event:', e);
            console.error('Audio error details:', audio.error);
            Alert.alert('Audio Error', `Failed to load audio: ${audio.error?.message || 'Unknown error'}`);
            stopTalkingAnimation();
            setHydeLoading(false);
          });
          
          audio.addEventListener('ended', () => {
            console.log('Audio playback finished');
            stopTalkingAnimation();
            setHydeLoading(false);
            URL.revokeObjectURL(audioUrl); // Clean up
          });
          
          // Set volume
          audio.volume = 1.0;
          
          console.log('Attempting to play audio...');
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Audio playing successfully');
              })
              .catch(err => {
                console.error('Error playing audio:', err);
                console.error('Error name:', err.name);
                console.error('Error message:', err.message);
                stopTalkingAnimation();
                setHydeLoading(false);
                if (err.name === 'NotAllowedError') {
                  Alert.alert('Audio Blocked', 'Browser blocked audio playback. Please check your browser settings and allow audio.');
                } else if (err.name === 'NotSupportedError') {
                  Alert.alert('Audio Error', 'Your browser does not support this audio format.');
                } else {
                  Alert.alert('Audio Error', `Could not play audio: ${err.message}`);
                }
              });
          }
        } catch (err: any) {
          console.error('Exception creating/playing audio:', err);
          Alert.alert('Audio Error', 'Failed to create audio player: ' + err.message);
          stopTalkingAnimation();
          setHydeLoading(false);
        }
      } else if (data.audio_base64) {
        console.log('=== MOBILE PLATFORM ===');
        console.log('Platform:', Platform.OS);
        console.log('Showing alert instead of playing audio');
        setHydeLoading(false);
        Alert.alert('Mr. Hyde Says', data.script);
      } else {
        console.log('=== NO AUDIO DATA ===');
        console.log('audio_base64 is empty or missing');
        console.log('Data error field:', data.error);
        setHydeLoading(false);
        setDisplayedText(data.script);
        if (data.error) {
          Alert.alert('Audio Generation Failed', `Mr. Hyde says: "${data.script}"\n\nError: ${data.error}`);
        }
      }
    } catch (error: any) {
      console.error('=== HYDE VERDICT ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      setHydeLoading(false);
      Alert.alert('Error', 'Failed to get Mr. Hyde\'s verdict. Please try again.');
    } finally {
      if (!data?.audio_base64) {
        setHydeLoading(false);
      }
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

        {/* Mr. Hyde Button */}
        <TouchableOpacity
          style={styles.hydeButton}
          onPress={hearMrHyde}
          disabled={hydeLoading}
        >
          {hydeLoading ? (
            <Text style={styles.hydeButtonText}>...</Text>
          ) : (
            <Text style={styles.hydeButtonText}>⚡ HEAR MR. HYDE</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/profile-edit')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Hyde Verdict Display with Animated Chicken */}
      {showHydeScript && (
        <View style={styles.hydeVerdictContainer}>
          <View style={styles.hydeCharacterSection}>
            <Animated.View
              style={[
                styles.hydeAvatar,
                {
                  transform: [
                    {
                      scaleY: talkingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.95],
                      }),
                    },
                    {
                      rotate: rotationAnimation.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: ['-15deg', '0deg', '15deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('@/assets/images/hyde-chicken.png')}
                style={styles.hydeChickenImage}
                resizeMode="contain"
              />
            </Animated.View>
            {isTalking && (
              <View style={styles.talkingIndicator}>
                <View style={[styles.soundWave, styles.wave1]} />
                <View style={[styles.soundWave, styles.wave2]} />
                <View style={[styles.soundWave, styles.wave3]} />
              </View>
            )}
            <View style={styles.hydeNameTag}>
              <Text style={styles.hydeNameText}>Mr. Hyde</Text>
            </View>
          </View>
          
          <View style={styles.speechBubble}>
            <View style={styles.speechBubbleTriangle} />
            <Text style={styles.hydeScriptText}>
              {displayedText || hydeScript}
            </Text>
          </View>
        </View>
      )}

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
  hydeButton: {
    backgroundColor: '#E31C45',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  hydeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hydeVerdictContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#E31C45',
    shadowColor: '#E31C45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hydeCharacterSection: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 120,
  },
  hydeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD6E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E31C45',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  hydeAvatarEmoji: {
    fontSize: 56,
  },
  hydeChickenImage: {
    width: '100%',
    height: '100%',
  },
  talkingIndicator: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  soundWave: {
    width: 4,
    backgroundColor: '#E31C45',
    borderRadius: 2,
  },
  wave1: {
    height: 12,
    animationDelay: '0s',
  },
  wave2: {
    height: 16,
    animationDelay: '0.1s',
  },
  wave3: {
    height: 12,
    animationDelay: '0.2s',
  },
  hydeNameTag: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E31C45',
    borderRadius: 12,
  },
  hydeNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E31C45',
    flex: 1,
  },
  speechBubbleTriangle: {
    position: 'absolute',
    top: 20,
    left: -10,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#E31C45',
  },
  hydeScriptText: {
    fontSize: 16,
    color: '#1c1917',
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'left',
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
