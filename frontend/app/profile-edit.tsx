import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useAuth } from '../contexts/AuthContext';
import { checkProfileExists, updateProfile, uploadAvatar } from '../services/api';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function ProfileEdit() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to edit your profile');
      router.back();
      return;
    }

    try {
      const response = await checkProfileExists(user.id);
      
      if (response.error || !response.data) {
        Alert.alert('Error', response.error || 'Failed to load profile');
        router.back();
        return;
      }
      
      const { exists, profile } = response.data;
      
      if (!exists || !profile) {
        Alert.alert('Error', 'Profile not found');
        router.back();
        return;
      }

      // Populate form fields
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || '');
      setMajor(profile.major || '');
      setInterests(profile.interests || '');
      setSkills(profile.skills ? profile.skills.join(', ') : '');
      setExperienceLevel(profile.experience_level || '');
      setAvatarUrl(profile.profile_picture_url || '');
      setGithubUrl(profile.urls?.github || '');
      setLinkedinUrl(profile.urls?.linkedin || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
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
        setUploadingImage(true);
        
        // Create a blob from the image
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        
        // Upload to Supabase
        const uploadResult = await uploadAvatar(user!.id, blob);
        
        if (uploadResult.error) {
          Alert.alert('Upload Failed', uploadResult.error);
        } else if (uploadResult.data?.url) {
          setAvatarUrl(uploadResult.data.url);
          Alert.alert('Success', 'Profile picture updated!');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }

    setSaving(true);

    try {
      // Parse skills from comma-separated string
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Build URLs object
      const urls: { [key: string]: string } = {};
      if (githubUrl.trim()) urls.github = githubUrl.trim();
      if (linkedinUrl.trim()) urls.linkedin = linkedinUrl.trim();

      const result = await updateProfile(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        major: major.trim() || undefined,
        interests: interests.trim() || undefined,
        skills: skillsArray.length > 0 ? skillsArray : undefined,
        experience_level: experienceLevel.trim() || undefined,
        profile_picture_url: avatarUrl || undefined,
        urls: Object.keys(urls).length > 0 ? urls : undefined,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} disabled={uploadingImage}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {firstName[0]?.toUpperCase() || '?'}
                    {lastName[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.section}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#78716c"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor="#78716c"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor="#78716c"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Major</Text>
            <TextInput
              style={styles.input}
              value={major}
              onChangeText={setMajor}
              placeholder="e.g., Computer Science"
              placeholderTextColor="#78716c"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Experience Level</Text>
            <TextInput
              style={styles.input}
              value={experienceLevel}
              onChangeText={setExperienceLevel}
              placeholder="e.g., Intermediate, Beginner"
              placeholderTextColor="#78716c"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Skills</Text>
            <Text style={styles.helperText}>Comma-separated (e.g., React, Python, Design)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={skills}
              onChangeText={setSkills}
              placeholder="e.g., React, Python, UI/UX"
              placeholderTextColor="#78716c"
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Interests</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={interests}
              onChangeText={setInterests}
              placeholder="Tell us what you're interested in..."
              placeholderTextColor="#78716c"
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>GitHub URL</Text>
            <TextInput
              style={styles.input}
              value={githubUrl}
              onChangeText={setGithubUrl}
              placeholder="https://github.com/username"
              placeholderTextColor="#78716c"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>LinkedIn URL</Text>
            <TextInput
              style={styles.input}
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              placeholder="https://linkedin.com/in/username"
              placeholderTextColor="#78716c"
              autoCapitalize="none"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#78716c',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1917',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
  },
});
