/**
 * Profile Creation Screen
 * Appears immediately after sign-up to collect user information
 * Theme: Modern pastel green design
 */
import React, { useState } from 'react';
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

const PROJECT_SIZES = ['small', 'medium', 'large'];
const PROJECT_DURATIONS = ['short', 'medium', 'long'];
const COLLABORATION_STYLES = [
  'Remote - Async',
  'Remote - Synchronous',
  'In-Person',
  'Hybrid',
  'Flexible',
];

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

export default function CreateProfile() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Form state
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
  
  // New matching preference fields
  const [availabilityHours, setAvailabilityHours] = useState('');
  const [projectSize, setProjectSize] = useState('');
  const [projectDuration, setProjectDuration] = useState('');
  const [collaborationStyle, setCollaborationStyle] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showExperiencePicker, setShowExperiencePicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCollaborationPicker, setShowCollaborationPicker] = useState(false);

  // Request image permissions on mount
  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile picture.');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Get base64 for persistence
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Use base64 for display to ensure image persists during form interaction
        const imageUri = asset.base64 
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setProfileImage(imageUri);
        setImageFile(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    try {
      // For web, use the URI directly
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
        // For mobile, use expo-image-picker's file URI
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
      // Don't fail the whole profile creation if image upload fails
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !major) {
      Alert.alert('Required fields', 'Please fill in your first name, last name, and major.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a profile.');
      return;
    }

    setLoading(true);

    try {
      // Upload profile picture if selected
      let profilePictureUrl: string | null = null;
      if (imageFile) {
        profilePictureUrl = await uploadProfilePicture();
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

      // Create profile
      const profileData = {
        auth_user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: user.email || '',
        major: major,
        experience_level: experienceLevel,
        skills: skillsArray,
        interests: interests.trim() || null,
        urls: urls,
        profile_picture_url: profilePictureUrl,
        // Matching preferences
        availability_hours_per_week: availabilityHours ? parseInt(availabilityHours) : null,
        project_size_preference: projectSize || null,
        project_duration_preference: projectDuration || null,
        collaboration_style: collaborationStyle || null,
      };

      const response = await fetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create profile');
      }

      const createdProfile = await response.json();
      console.log('Profile created:', createdProfile);

      Alert.alert('Success!', 'Your profile has been created. Welcome to Project Jekyll & Hyde!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);

    } catch (error: any) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', error.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Tell us about yourself!</Text>
      </View>

      {/* Profile Picture */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📷</Text>
              <Text style={styles.placeholderSubtext}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.imageHint}>Tap to upload a profile picture (optional)</Text>
      </View>

      {/* Required Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information *</Text>
        
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="John"
          placeholderTextColor="#999"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Doe"
          placeholderTextColor="#999"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Major</Text>
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
      </View>

      {/* Optional Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Information (Optional)</Text>

        <Text style={styles.label}>Experience Level</Text>
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

        <Text style={styles.label}>Skills</Text>
        <TextInput
          style={styles.input}
          value={skills}
          onChangeText={setSkills}
          placeholder="Python, JavaScript, React (comma-separated)"
          placeholderTextColor="#999"
          multiline
        />

        <Text style={styles.label}>Interests</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={interests}
          onChangeText={setInterests}
          placeholder="What are you passionate about?"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>GitHub URL</Text>
        <TextInput
          style={styles.input}
          value={githubUrl}
          onChangeText={setGithubUrl}
          placeholder="https://github.com/yourusername"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.label}>LinkedIn URL</Text>
        <TextInput
          style={styles.input}
          value={linkedinUrl}
          onChangeText={setLinkedinUrl}
          placeholder="https://linkedin.com/in/yourusername"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      {/* Matching Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Preferences (Optional)</Text>
        <Text style={styles.sectionSubtitle}>Help us match you with the right projects</Text>

        <Text style={styles.label}>Availability (hours per week)</Text>
        <TextInput
          style={styles.input}
          value={availabilityHours}
          onChangeText={setAvailabilityHours}
          placeholder="e.g., 10"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Preferred Project Size</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowSizePicker(!showSizePicker)}
        >
          <Text style={projectSize ? styles.pickerText : styles.pickerPlaceholder}>
            {projectSize ? projectSize.charAt(0).toUpperCase() + projectSize.slice(1) : 'Select project size'}
          </Text>
        </TouchableOpacity>
        {showSizePicker && (
          <ScrollView style={styles.pickerContainer} nestedScrollEnabled={true}>
            {PROJECT_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={styles.pickerItem}
                onPress={() => {
                  setProjectSize(size);
                  setShowSizePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Preferred Project Duration</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowDurationPicker(!showDurationPicker)}
        >
          <Text style={projectDuration ? styles.pickerText : styles.pickerPlaceholder}>
            {projectDuration ? projectDuration.charAt(0).toUpperCase() + projectDuration.slice(1) + '-term' : 'Select duration'}
          </Text>
        </TouchableOpacity>
        {showDurationPicker && (
          <ScrollView style={styles.pickerContainer} nestedScrollEnabled={true}>
            {PROJECT_DURATIONS.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={styles.pickerItem}
                onPress={() => {
                  setProjectDuration(duration);
                  setShowDurationPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>
                  {duration.charAt(0).toUpperCase() + duration.slice(1)}-term
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Collaboration Style</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCollaborationPicker(!showCollaborationPicker)}
        >
          <Text style={collaborationStyle ? styles.pickerText : styles.pickerPlaceholder}>
            {collaborationStyle || 'Select collaboration style'}
          </Text>
        </TouchableOpacity>
        {showCollaborationPicker && (
          <ScrollView style={styles.pickerContainer} nestedScrollEnabled={true}>
            {COLLABORATION_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={styles.pickerItem}
                onPress={() => {
                  setCollaborationStyle(style);
                  setShowCollaborationPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{style}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Profile</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>* Required fields</Text>
      </View>
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
  header: {
    marginBottom: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
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
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 44,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.primaryDark,
    marginTop: 6,
    fontWeight: '500',
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
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
    marginTop: -8,
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
  submitButton: {
    backgroundColor: Colors.accent,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
});
