/**
 * Profile View/Edit Screen
 * View and edit user profile information
 * Theme: Modern pastel green design
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, supabase } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';

const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : Platform.OS === 'android' 
    ? 'http://10.0.2.2:8000' 
    : 'http://localhost:8000';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const MAJORS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Engineering',
  'Design',
  'Business',
  'Other',
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, checkProfileExists } = useAuth();
  
  // Form state
  const [profileId, setProfileId] = useState('');
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
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showExperiencePicker, setShowExperiencePicker] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  
  // Hyde verdict state
  const [hydeLoading, setHydeLoading] = useState(false);
  const [hydeScript, setHydeScript] = useState('');
  const [showHydeScript, setShowHydeScript] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTalking, setIsTalking] = useState(false);
  const audioRef = useRef<any>(null);
  const talkingAnimation = useRef(new Animated.Value(0)).current;

  // Load profile data on mount
  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
      setHasProfile(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) {
      setHasProfile(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { exists, profile } = await checkProfileExists(user.id);
      
      if (!exists || !profile) {
        setHasProfile(false);
        setLoading(false);
        return;
      }

      setHasProfile(true);
      // Populate form with existing data
      setProfileId(profile.id);
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setMajor(profile.major || '');
      setExperienceLevel(profile.experience_level || 'beginner');
      setSkills(profile.skills ? profile.skills.join(', ') : '');
      setInterests(profile.interests || '');
      setGithubUrl(profile.urls?.github || '');
      setLinkedinUrl(profile.urls?.linkedin || '');
      setProfileImage(profile.profile_picture_url || null);
      
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

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
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Animation functions for Hyde character
  const animateTyping = (text: string, duration: number) => {
    setDisplayedText('');
    const words = text.split(' ');
    const msPerWord = (duration * 1000) / words.length;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, msPerWord);
    
    return () => clearInterval(interval);
  };

  const startTalkingAnimation = () => {
    setIsTalking(true);
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
  };

  const stopTalkingAnimation = () => {
    setIsTalking(false);
    talkingAnimation.stopAnimation();
    talkingAnimation.setValue(0);
  };

  const hearMrHyde = async () => {
    if (!profileId) {
      Alert.alert('Error', 'Profile not loaded');
      return;
    }

    try {
      setHydeLoading(true);
      setShowHydeScript(false);
      
      console.log('Fetching Hyde verdict for profile:', profileId);
      const response = await fetch(`${API_URL}/profile/${profileId}/hyde-verdict`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error('Failed to get Hyde verdict');
      }

      const data = await response.json();
      console.log('Hyde verdict received:', {
        hasScript: !!data.script,
        hasAudio: !!data.audio_base64,
        audioLength: data.audio_base64?.length,
        isRoast: data.is_roast
      });
      
      if (data.script) {
        setHydeScript(data.script);
        setShowHydeScript(true);
      }

      // Play audio if available
      if (data.audio_base64 && Platform.OS === 'web') {
        try {
          console.log('Creating audio element...');
          console.log('Audio base64 length:', data.audio_base64.length);
          console.log('First 100 chars of base64:', data.audio_base64.substring(0, 100));
          
          // Create audio blob for better compatibility
          const binaryString = atob(data.audio_base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);
          
          console.log('Created blob URL:', audioUrl);
          
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          // Add event listeners for animations
          audio.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully, duration:', audio.duration);
            // Start typing animation based on audio duration
            if (data.script && audio.duration > 0) {
              animateTyping(data.script, audio.duration);
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
          });
          
          audio.addEventListener('ended', () => {
            console.log('Audio playback finished');
            stopTalkingAnimation();
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
                if (err.name === 'NotAllowedError') {
                  Alert.alert('Audio Blocked', 'Browser blocked audio playback. Please check your browser settings and allow audio.');
                } else if (err.name === 'NotSupportedError') {
                  Alert.alert('Audio Error', 'Your browser does not support this audio format.');
                } else {
                  Alert.alert('Audio Error', `Could not play audio: ${err.message}`);
                }
              });
          }
        } catch (err) {
          console.error('Exception creating/playing audio:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          Alert.alert('Audio Error', 'Failed to create audio player: ' + errorMessage);
          stopTalkingAnimation();
        }
      } else if (data.audio_base64) {
        // For mobile, we'll need expo-av
        console.log('Mobile platform - audio not implemented yet');
        Alert.alert('Mr. Hyde Says', data.script);
      } else {
        console.log('No audio data received');
        Alert.alert('Mr. Hyde Says', data.script);
      }
    } catch (error) {
      console.error('Error getting Hyde verdict:', error);
      Alert.alert('Error', 'Failed to get Mr. Hyde\'s verdict. Please try again.');
    } finally {
      setHydeLoading(false);
    }
  };

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!imageFile || !user) return profileImage;

    try {
      if (Platform.OS === 'web') {
        const response = await fetch(imageFile.uri);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch(`${API_URL}/upload-avatar/${user.id}`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await uploadResponse.json();
        return data.url;
      } else {
        const formData = new FormData();
        formData.append('file', {
          uri: imageFile.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const uploadResponse = await fetch(`${API_URL}/upload-avatar/${user.id}`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await uploadResponse.json();
        return data.url;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return profileImage;
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !major) {
      Alert.alert('Required fields', 'Please fill in your first name, last name, and major.');
      return;
    }

    setSaving(true);

    try {
      // Upload new profile picture if changed
      let newProfilePictureUrl = profileImage;
      if (imageFile) {
        newProfilePictureUrl = await uploadProfilePicture();
      }

      // Parse skills into array
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Build URLs object
      const urls: Record<string, string> = {};
      if (githubUrl.trim()) urls.github = githubUrl.trim();
      if (linkedinUrl.trim()) urls.linkedin = linkedinUrl.trim();

      // Update profile via Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          major: major,
          experience_level: experienceLevel,
          skills: skillsArray,
          interests: interests.trim() || null,
          urls: urls,
          profile_picture_url: newProfilePictureUrl,
        })
        .eq('auth_user_id', user?.id);

      if (error) throw error;

      Alert.alert('Success!', 'Your profile has been updated.');
      setIsEditing(false);
      setImageFile(null);
      
      // Reload profile to show updated data
      await loadProfile();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user || !hasProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>No Profile Found</Text>
        <Text style={styles.subtitle}>Please create your profile first.</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => router.push('/create-profile')}
        >
          <Text style={styles.saveButtonText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <View style={styles.headerButtons}>
          {!isEditing && (
            <>
              <TouchableOpacity 
                onPress={hearMrHyde} 
                style={styles.hydeButton}
                disabled={hydeLoading}
              >
                {hydeLoading ? (
                  <Text style={styles.hydeButtonText}>...</Text>
                ) : (
                  <Text style={styles.hydeButtonText}>🔊 HEAR MR. HYDE</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Hyde Script Display with Animated Character */}
      {showHydeScript && hydeScript && (
        <View style={styles.hydeVerdictContainer}>
          <View style={styles.hydeCharacterSection}>
            <Animated.View 
              style={[
                styles.hydeAvatar,
                {
                  transform: [{
                    scaleY: talkingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.hydeAvatarText}>😈</Text>
            </Animated.View>
            
            {isTalking && (
              <View style={styles.talkingIndicator}>
                <View style={[styles.soundWave, { height: 12 }]} />
                <View style={[styles.soundWave, { height: 18 }]} />
                <View style={[styles.soundWave, { height: 14 }]} />
              </View>
            )}
            
            <Text style={styles.hydeNameTag}>Mr. Hyde</Text>
          </View>
          
          {displayedText ? (
            <View style={styles.speechBubble}>
              <View style={styles.speechBubbleTriangle} />
              <Text style={styles.hydeScriptText}>{displayedText}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Profile Picture */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={isEditing ? pickImage : undefined} style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {firstName && lastName ? `${firstName[0]}${lastName[0]}` : '👤'}
              </Text>
            </View>
          )}
          {isEditing && (
            <View style={styles.editImageBadge}>
              <Text style={styles.editImageBadgeText}>📷</Text>
            </View>
          )}
        </TouchableOpacity>
        {isEditing && <Text style={styles.imageHint}>Tap to change picture</Text>}
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="John"
          placeholderTextColor="#999"
          autoCapitalize="words"
          editable={isEditing}
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Doe"
          placeholderTextColor="#999"
          autoCapitalize="words"
          editable={isEditing}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email || ''}
          editable={false}
        />

        <Text style={styles.label}>Major</Text>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowMajorPicker(!showMajorPicker)}
            >
              <Text style={major ? styles.pickerText : styles.pickerPlaceholder}>
                {major || 'Select your major'}
              </Text>
            </TouchableOpacity>
            {showMajorPicker && (
              <ScrollView style={styles.pickerContainer} nestedScrollEnabled={true}>
                {MAJORS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.pickerItem}
                    onPress={() => {
                      setMajor(m);
                      setShowMajorPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={major}
            editable={false}
          />
        )}
      </View>

      {/* Additional Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Information</Text>

        <Text style={styles.label}>Experience Level</Text>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowExperiencePicker(!showExperiencePicker)}
            >
              <Text style={styles.pickerText}>
                {experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}
              </Text>
            </TouchableOpacity>
            {showExperiencePicker && (
              <ScrollView style={styles.pickerContainer} nestedScrollEnabled={true}>
                {EXPERIENCE_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.pickerItem}
                    onPress={() => {
                      setExperienceLevel(level);
                      setShowExperiencePicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}
            editable={false}
          />
        )}

        <Text style={styles.label}>Skills</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={skills}
          onChangeText={setSkills}
          placeholder="Python, JavaScript, React (comma-separated)"
          placeholderTextColor="#999"
          multiline
          editable={isEditing}
        />

        <Text style={styles.label}>Interests</Text>
        <TextInput
          style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
          value={interests}
          onChangeText={setInterests}
          placeholder="What are you passionate about?"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          editable={isEditing}
        />

        <Text style={styles.label}>GitHub URL</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={githubUrl}
          onChangeText={setGithubUrl}
          placeholder="https://github.com/yourusername"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="url"
          editable={isEditing}
        />

        <Text style={styles.label}>LinkedIn URL</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={linkedinUrl}
          onChangeText={setLinkedinUrl}
          placeholder="https://linkedin.com/in/yourusername"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="url"
          editable={isEditing}
        />
      </View>

      {/* Action Buttons */}
      {isEditing ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsEditing(false);
              setImageFile(null);
              loadProfile(); // Reset to original data
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  hydeButton: {
    backgroundColor: '#FF69B4', // Hot pink
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  hydeButtonText: {
    color: '#FFFFFF', // Pure white with shadow
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  // Hyde Animated Character Styles
  hydeVerdictContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  hydeCharacterSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  hydeAvatar: {
    width: 80,
    height: 80,
    borderRadius:40,
    backgroundColor: '#FFE4F0',
    borderWidth: 3,
    borderColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  hydeAvatarText: {
    fontSize: 44,
  },
  talkingIndicator: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    height: 20,
    alignItems: 'flex-end',
  },
  soundWave: {
    width: 4,
    backgroundColor: '#FF69B4',
    borderRadius: 2,
  },
  hydeNameTag: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF69B4',
    letterSpacing: 0.5,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF69B4',
    maxWidth: '85%',
    position: 'relative',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  speechBubbleTriangle: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF69B4',
  },
  hydeScriptText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.surface,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  editImageBadgeText: {
    fontSize: 18,
  },
  imageHint: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text.secondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    padding: 14,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    position: 'relative',
    zIndex: 1000,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
