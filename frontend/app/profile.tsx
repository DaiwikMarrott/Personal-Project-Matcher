/**
 * Profile View/Edit Screen
 * View and edit user profile information
 */
import React, { useState, useEffect } from 'react';
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
        <ActivityIndicator size="large" color="#007AFF" />
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
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
        )}
      </View>

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
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editImageBadgeText: {
    fontSize: 18,
  },
  imageHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    position: 'relative',
    zIndex: 1000,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
