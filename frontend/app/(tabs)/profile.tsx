/**
 * Profile Tab Screen
 * View and edit user profile — combined in one screen
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useAuth, supabase } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getProjects, API_BASE_URL } from '@/services/api';
import { EXPERIENCE_LEVELS, MAJORS } from '@/constants/app-constants';

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
  const [showClosedProjects, setShowClosedProjects] = useState(false);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [major, setMajor] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showExperiencePicker, setShowExperiencePicker] = useState(false);

  // Reload profile data when screen comes into focus (to reflect status changes)
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [user])
  );

  const loadProfileData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load profile
      const { exists, profile: userProfile } = await checkProfileExists(user.id);
      
      if (!exists || !userProfile) {
        console.log('[ProfileTab] No profile found');
        setLoading(false);
        return;
      }

      setProfile(userProfile);

      // Populate edit form fields
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setMajor(userProfile.major || '');
      setExperienceLevel(userProfile.experience_level || 'beginner');
      setSkills(userProfile.skills ? userProfile.skills.join(', ') : '');
      setInterests(userProfile.interests || '');
      setGithubUrl(userProfile.urls?.github || '');
      setLinkedinUrl(userProfile.urls?.linkedin || '');
      setProfileImage(userProfile.profile_picture_url || null);

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
    if (url) Linking.openURL(url);
  };

  // ─── Edit helpers ──────────────────────────────────────────────────────────

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setProfileImage(asset.uri);
        setImageFile(asset);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!imageFile || !user) return profileImage;
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(imageFile.uri);
        const blob = await response.blob();
        formData.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      } else {
        formData.append('file', { uri: imageFile.uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
      }
      const uploadResponse = await fetch(`${API_BASE_URL}/upload-avatar/${user.id}`, { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('Upload failed');
      const data = await uploadResponse.json();
      return data.url;
    } catch {
      return profileImage;
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !major) {
      Alert.alert('Required fields', 'Please fill in your first name, last name, and major.');
      return;
    }
    setSaving(true);
    try {
      let newProfilePictureUrl = profileImage;
      if (imageFile) newProfilePictureUrl = await uploadProfilePicture();

      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const urls: Record<string, string> = {};
      if (githubUrl.trim()) urls.github = githubUrl.trim();
      if (linkedinUrl.trim()) urls.linkedin = linkedinUrl.trim();

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          major,
          experience_level: experienceLevel,
          skills: skillsArray,
          interests: interests.trim() || null,
          urls,
          profile_picture_url: newProfilePictureUrl,
        })
        .eq('auth_user_id', user?.id);

      if (error) throw error;

      setIsEditing(false);
      setImageFile(null);
      await loadProfileData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setImageFile(null);
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setMajor(profile.major || '');
      setExperienceLevel(profile.experience_level || 'beginner');
      setSkills(profile.skills ? profile.skills.join(', ') : '');
      setInterests(profile.interests || '');
      setGithubUrl(profile.urls?.github || '');
      setLinkedinUrl(profile.urls?.linkedin || '');
      setProfileImage(profile.profile_picture_url || null);
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
        <Text style={styles.emptySubtext}>Please restart the app</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Edit mode ─────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.editContent}>
        {/* Profile Picture */}
        <View style={styles.editImageSection}>
          <TouchableOpacity onPress={pickImage} style={styles.editImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.editProfileImage} />
            ) : (
              <View style={styles.editPlaceholderImage}>
                <Text style={styles.editPlaceholderText}>
                  {firstName && lastName ? `${firstName[0]}${lastName[0]}` : '👤'}
                </Text>
              </View>
            )}
            <View style={styles.editImageBadge}><Text>📷</Text></View>
          </TouchableOpacity>
          <Text style={styles.imageHint}>Tap to change picture</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Basic Information</Text>

          <Text style={styles.editLabel}>First Name</Text>
          <TextInput style={styles.editInput} value={firstName} onChangeText={setFirstName}
            placeholder="John" placeholderTextColor="#999" autoCapitalize="words" />

          <Text style={styles.editLabel}>Last Name</Text>
          <TextInput style={styles.editInput} value={lastName} onChangeText={setLastName}
            placeholder="Doe" placeholderTextColor="#999" autoCapitalize="words" />

          <Text style={styles.editLabel}>Email</Text>
          <TextInput style={[styles.editInput, styles.editInputDisabled]} value={user?.email || ''} editable={false} />

          <Text style={styles.editLabel}>Major</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowMajorPicker(!showMajorPicker)}>
            <Text style={major ? styles.pickerText : styles.pickerPlaceholder}>{major || 'Select your major'}</Text>
          </TouchableOpacity>
          {showMajorPicker && (
            <ScrollView style={styles.pickerContainer} nestedScrollEnabled>
              {MAJORS.map((m) => (
                <TouchableOpacity key={m} style={styles.pickerItem} onPress={() => { setMajor(m); setShowMajorPicker(false); }}>
                  <Text style={styles.pickerItemText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Additional Information */}
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Additional Information</Text>

          <Text style={styles.editLabel}>Experience Level</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowExperiencePicker(!showExperiencePicker)}>
            <Text style={styles.pickerText}>{experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}</Text>
          </TouchableOpacity>
          {showExperiencePicker && (
            <ScrollView style={styles.pickerContainer} nestedScrollEnabled>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity key={level} style={styles.pickerItem} onPress={() => { setExperienceLevel(level); setShowExperiencePicker(false); }}>
                  <Text style={styles.pickerItemText}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.editLabel}>Skills</Text>
          <TextInput style={styles.editInput} value={skills} onChangeText={setSkills}
            placeholder="Python, JavaScript, React (comma-separated)" placeholderTextColor="#999" multiline />

          <Text style={styles.editLabel}>Interests</Text>
          <TextInput style={[styles.editInput, styles.editTextArea]} value={interests} onChangeText={setInterests}
            placeholder="What are you passionate about?" placeholderTextColor="#999" multiline numberOfLines={3} />

          <Text style={styles.editLabel}>GitHub URL</Text>
          <TextInput style={styles.editInput} value={githubUrl} onChangeText={setGithubUrl}
            placeholder="https://github.com/yourusername" placeholderTextColor="#999" autoCapitalize="none" keyboardType="url" />

          <Text style={styles.editLabel}>LinkedIn URL</Text>
          <TextInput style={styles.editInput} value={linkedinUrl} onChangeText={setLinkedinUrl}
            placeholder="https://linkedin.com/in/yourusername" placeholderTextColor="#999" autoCapitalize="none" keyboardType="url" />
        </View>

        {/* Save / Cancel */}
        <View style={styles.editButtonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── View mode ──────────────────────────────────────────────────────────────
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <View style={styles.container}>
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
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
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
        {/* Open Projects */}
        <Text style={styles.sectionTitle}>
          Open Projects ({userProjects.filter(p => p.status === 'open' || !p.status).length})
        </Text>
        {userProjects.filter(p => p.status === 'open' || !p.status).length === 0 ? (
          <Text style={styles.emptyText}>No open projects yet</Text>
        ) : (
          <View style={styles.projectList}>
            {userProjects
              .filter(p => p.status === 'open' || !p.status)
              .map((project) => (
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
                    <View style={styles.openBadge}>
                      <Text style={styles.openBadgeText}>🟢 Open</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>

      {/* Closed Projects Section (Collapsible) */}
      {userProjects.filter(p => p.status === 'closed').length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.closedProjectsHeader}
            onPress={() => setShowClosedProjects(!showClosedProjects)}
            activeOpacity={0.7}
          >
            <Text style={styles.closedProjectsTitle}>
              Closed Projects ({userProjects.filter(p => p.status === 'closed').length})
            </Text>
            <Text style={styles.toggleIcon}>{showClosedProjects ? '▼' : '►'}</Text>
          </TouchableOpacity>
          
          {showClosedProjects && (
            <View style={styles.projectList}>
              {userProjects
                .filter(p => p.status === 'closed')
                .map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[styles.projectCard, styles.closedProjectCard]}
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
                          style={[styles.projectImage, styles.closedProjectImage]}
                        />
                      ) : (
                        <View style={[styles.projectImagePlaceholder, styles.closedProjectImagePlaceholder]}>
                          <Text style={styles.projectImagePlaceholderText}>📁</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Project Info */}
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <View style={styles.closedBadge}>
                        <Text style={styles.closedBadgeText}>🔴 Closed</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>
      )}

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
  openBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  closedProjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  closedProjectsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#78716c',
  },
  toggleIcon: {
    fontSize: 16,
    color: '#78716c',
    fontWeight: '700',
  },
  closedProjectCard: {
    opacity: 0.7,
    borderColor: '#d6d3d1',
  },
  closedProjectImage: {
    opacity: 0.6,
  },
  closedProjectImagePlaceholder: {
    backgroundColor: '#e7e5e4',
  },
  closedBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  closedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
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
  emptySubtext: {
    fontSize: 14,
    color: '#a8a29e',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
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

  // ─── Edit mode styles ─────────────────────────────────────────────────────
  editContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  editImageSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(167,243,208,0.5)',
  },
  editImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  editProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  editPlaceholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPlaceholderText: {
    fontSize: 40,
    color: '#065f46',
    fontWeight: 'bold',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageHint: {
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
  },
  editSection: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(167,243,208,0.5)',
  },
  editSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534e',
    marginBottom: 8,
    marginTop: 14,
  },
  editInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1c1917',
  },
  editInputDisabled: {
    backgroundColor: '#f5f5f4',
    color: '#78716c',
  },
  editTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    padding: 14,
  },
  pickerText: {
    fontSize: 16,
    color: '#1c1917',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#a8a29e',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    zIndex: 1000,
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1c1917',
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
