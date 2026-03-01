/**
 * Project Detail Page
 * Shows detailed information about a specific project
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';

const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : Platform.OS === 'android' 
    ? 'http://10.0.2.2:8000' 
    : 'http://localhost:8000';

interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  tags?: string[];
  duration?: string;
  availability_needed?: string;
  project_image_url?: string | null;
  roadmap?: any;
  status: string;
  created_at?: string;
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [editedDuration, setEditedDuration] = useState('');
  const [editedAvailability, setEditedAvailability] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');

  useEffect(() => {
    if (id) {
      fetchProject();
      if (user) {
        fetchUserProfile();
      }
    }
  }, [id, user]);

  const fetchUserProfile = async () => {
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }
    
    console.log('👤 Fetching profile for user.id:', user.id);
    
    try {
      const response = await fetch(`${API_URL}/profile/check/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.profile) {
          console.log('✅ Profile fetched, profile.id:', data.profile.id);
          setUserProfileId(data.profile.id);
        } else {
          console.log('❌ Profile does not exist for this user');
        }
      } else {
        console.log('❌ Profile fetch failed with status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching project with ID:', id);
      console.log('API URL:', API_URL);
      
      const response = await fetch(`${API_URL}/project/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to load project: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Project data received:', data);
      console.log('📦 Project owner_id:', data.owner_id);
      setProject(data);
      
      // Initialize edit fields
      setEditedTitle(data.title || '');
      setEditedDescription(data.description || '');
      setEditedTags(data.tags?.join(', ') || '');
      setEditedDuration(data.duration || '');
      setEditedAvailability(data.availability_needed || '');
      setEditedImageUrl(data.project_image_url || '');
    } catch (err: any) {
      console.error('Error fetching project:', err);
      if (err.message?.includes('Network request failed') || err.name === 'TypeError') {
        setError(`Cannot reach backend at ${API_URL}. Make sure the backend server is running.`);
      } else {
        setError(err.message || 'Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to apply for this project');
      return;
    }

    setApplying(true);
    
    // TODO: Implement application logic
    setTimeout(() => {
      setApplying(false);
      Alert.alert(
        'Application Submitted!',
        'We\'ll let you know when the project owner responds.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel editing - reset to original values
      if (project) {
        setEditedTitle(project.title);
        setEditedDescription(project.description);
        setEditedTags(project.tags?.join(', ') || '');
        setEditedDuration(project.duration || '');
        setEditedAvailability(project.availability_needed || '');
        setEditedImageUrl(project.project_image_url || '');
      }
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    if (!project) return;

    setSaving(true);
    try {
      const updatedProject = {
        owner_id: project.owner_id,
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        tags: editedTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        duration: editedDuration.trim() || null,
        availability_needed: editedAvailability.trim() || null,
        project_image_url: editedImageUrl.trim() || null,
      };

      const response = await fetch(`${API_URL}/project/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update project');
      }

      const data = await response.json();
      setProject(data);
      
      // Update edit fields with saved data
      setEditedTitle(data.title);
      setEditedDescription(data.description);
      setEditedTags(data.tags?.join(', ') || '');
      setEditedDuration(data.duration || '');
      setEditedAvailability(data.availability_needed || '');
      setEditedImageUrl(data.project_image_url || '');
      
      setIsEditMode(false);
      Alert.alert('Success', 'Project updated successfully!');
    } catch (err: any) {
      console.error('Update error:', err);
      Alert.alert('Error', err.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditedImageUrl(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Project not found'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isOwner = userProfileId && project.owner_id === userProfileId;
  
  // Debug ownership
  console.log('🔍 Ownership Check:');
  console.log('  - userProfileId:', userProfileId);
  console.log('  - project.owner_id:', project?.owner_id);
  console.log('  - isOwner:', isOwner);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButtonTop} onPress={() => router.back()}>
          <Text style={styles.backButtonTopText}>← Back</Text>
        </TouchableOpacity>

        {/* Edit/Save/Cancel Buttons for Owner */}
        {isOwner && (
          <View style={styles.editButtonsContainer}>
            {!isEditMode ? (
              <TouchableOpacity style={styles.editButton} onPress={handleEditToggle}>
                <Text style={styles.editButtonText}>✏️ Edit Project</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActionsRow}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleEditToggle}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={Colors.text.inverse} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>💾 Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Project Image */}
        {(editedImageUrl || project.project_image_url) ? (
          <View>
            <Image 
              source={{ uri: isEditMode ? editedImageUrl : project.project_image_url || '' }} 
              style={styles.projectImage}
              resizeMode="cover"
            />
            {isEditMode && isOwner && (
              <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                <Text style={styles.changeImageButtonText}>📷 Change Image</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>💀</Text>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
            {isEditMode && isOwner && (
              <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                <Text style={styles.changeImageButtonText}>📷 Add Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Title and Status */}
        <View style={styles.header}>
          {isEditMode ? (
            <TextInput
              style={styles.titleInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Project Title"
              placeholderTextColor={Colors.text.tertiary}
              multiline
            />
          ) : (
            <Text style={styles.title}>{project.title}</Text>
          )}
          <View style={[styles.statusBadge, { 
            backgroundColor: project.status === 'open' ? Colors.status.open : Colors.status.closed 
          }]}>
            <Text style={styles.statusText}>
              {project.status === 'open' ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Description</Text>
          {isEditMode ? (
            <TextInput
              style={styles.descriptionInput}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Describe your project..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={6}
            />
          ) : (
            <Text style={styles.description}>{project.description}</Text>
          )}
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Duration</Text>
          {isEditMode ? (
            <TextInput
              style={styles.input}
              value={editedDuration}
              onChangeText={setEditedDuration}
              placeholder="e.g., 2 weeks, 3 months"
              placeholderTextColor={Colors.text.tertiary}
            />
          ) : project.duration ? (
            <Text style={styles.infoText}>⏱️ {project.duration}</Text>
          ) : (
            <Text style={styles.infoTextLight}>Not specified</Text>
          )}
        </View>

        {/* Availability Needed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability Needed</Text>
          {isEditMode ? (
            <TextInput
              style={styles.input}
              value={editedAvailability}
              onChangeText={setEditedAvailability}
              placeholder="e.g., 10 hours/week, Weekends"
              placeholderTextColor={Colors.text.tertiary}
            />
          ) : project.availability_needed ? (
            <Text style={styles.infoText}>📅 {project.availability_needed}</Text>
          ) : (
            <Text style={styles.infoTextLight}>Not specified</Text>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technologies & Skills</Text>
          {isEditMode ? (
            <TextInput
              style={styles.input}
              value={editedTags}
              onChangeText={setEditedTags}
              placeholder="Separate tags with commas (e.g., React, Python, AI)"
              placeholderTextColor={Colors.text.tertiary}
            />
          ) : project.tags && project.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {project.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.infoTextLight}>No tags</Text>
          )}
        </View>

        {/* AI Roadmap */}
        {project.roadmap && project.roadmap.overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI-Generated Roadmap</Text>
            <View style={styles.roadmapCard}>
              <Text style={styles.roadmapText}>{project.roadmap.overview}</Text>
            </View>
          </View>
        )}

        {/* Apply Button (only if not owner and project is open) */}
        {!isOwner && project.status === 'open' && (
          <TouchableOpacity
            style={[styles.applyButton, applying && styles.applyButtonDisabled]}
            onPress={handleApply}
            disabled={applying}
          >
            {applying ? (
              <ActivityIndicator color={Colors.text.inverse} />
            ) : (
              <Text style={styles.applyButtonText}>Apply to Join Project</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Owner Message */}
        {isOwner && (
          <View style={styles.ownerMessage}>
            <Text style={styles.ownerMessageText}>
              📝 This is your project. Manage it from your dashboard.
            </Text>
          </View>
        )}

        {/* Closed Project Message */}
        {!isOwner && project.status !== 'open' && (
          <View style={styles.closedMessage}>
            <Text style={styles.closedMessageText}>
              🔒 This project is currently closed to new applicants.
            </Text>
          </View>
        )}
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
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonTop: {
    marginBottom: 20,
  },
  backButtonTopText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  projectImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 24,
  },
  placeholderImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.secondary,
  },
  infoText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  infoTextLight: {
    fontSize: 16,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  editButtonsContainer: {
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  editButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  changeImageButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 24,
  },
  changeImageButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  titleInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginRight: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  descriptionInput: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  input: {
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  roadmapCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  roadmapText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  applyButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  backButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },
  ownerMessage: {
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.info,
    marginBottom: 24,
  },
  ownerMessageText: {
    fontSize: 15,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  closedMessage: {
    backgroundColor: Colors.error + '20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    marginBottom: 24,
  },
  closedMessageText: {
    fontSize: 15,
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
