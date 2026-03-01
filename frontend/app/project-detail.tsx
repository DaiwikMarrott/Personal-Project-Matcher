/**
 * Project Detail Screen
 * View full project information including roadmap
 */
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Animated,
  Switch,
} from 'react-native';
const drJekyllIcon = require('@/assets/images/dr-jekyll-icon.png');
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { updateProject, deleteProject, updateProjectStatus, uploadProjectImage, expressInterest } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';

interface ProjectData {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  owner_first_name?: string;
  owner_last_name?: string;
  project_image_url?: string;
  tags: string[];
  duration?: string;
  availability?: string;
  status?: string;
  roadmap?: any;
  created_at?: string;
  similarity_score?: number;
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, checkProfileExists } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [expressedInterest, setExpressedInterest] = useState(false);
  const [expressingInterest, setExpressingInterest] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Animation refs for Jekyll icon
  const talkingAnimation = useRef(new Animated.Value(0)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Read denied status from navigation params
    if (params.isDenied === '1') {
      setIsDenied(true);
    }
    loadProjectData();
  }, []);

  // Start Jekyll icon animation when roadmap is available
  useEffect(() => {
    if (project?.roadmap) {
      startJekyllAnimation();
    }
    return () => {
      stopJekyllAnimation();
    };
  }, [project?.roadmap]);

  const startJekyllAnimation = () => {
    // Gentle bobbing motion
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

  const stopJekyllAnimation = () => {
    talkingAnimation.stopAnimation();
    talkingAnimation.setValue(0);
    rotationAnimation.stopAnimation();
    rotationAnimation.setValue(0);
  };

  const loadProjectData = async () => {
    try {
      // In a real implementation, you would fetch project details from the API
      // For now, we'll reconstruct from passed params
      if (params.projectData && typeof params.projectData === 'string') {
        const projectData = JSON.parse(params.projectData);
        console.log('[ProjectDetail] Loaded project data:', projectData);
        console.log('[ProjectDetail] Project has owner_id:', projectData.owner_id);
        
        setProject(projectData);
        setEditedDescription(projectData.description || '');
        
        // Check if user owns this project
        if (user) {
          console.log('[ProjectDetail] Checking ownership - user.id:', user.id);
          console.log('[ProjectDetail] Project owner_id:', projectData.owner_id);
          
          const { exists, profile } = await checkProfileExists(user.id);
          console.log('[ProjectDetail] Profile check - exists:', exists, 'profile:', profile);
          
          if (exists && profile && projectData.owner_id === profile.id) {
            console.log('[ProjectDetail] User is owner!');
            setIsOwner(true);
          } else {
            console.log('[ProjectDetail] User is NOT owner');
            console.log('[ProjectDetail] Comparison:', projectData.owner_id, '===', profile?.id);
          }
        } else {
          console.log('[ProjectDetail] No user logged in');
        }
      } else {
        console.error('[ProjectDetail] No project data in params');
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return styles.priority_high;
      case 'medium': return styles.priority_medium;
      case 'low': return styles.priority_low;
      default: return styles.priority_medium;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const handleSaveDescription = async () => {
    if (!project) return;
    
    try {
      // Upload new image if selected
      let projectImageUrl = project.project_image_url;
      if (newImageUri) {
        console.log('[ProjectDetail] Uploading new image...');
        const response = await fetch(newImageUri);
        const blob = await response.blob();
        console.log('[ProjectDetail] Blob created, size:', blob.size);
        
        const uploadResult = await uploadProjectImage(project.owner_id, blob);
        console.log('[ProjectDetail] Upload result:', uploadResult);
        
        if (uploadResult.data) {
          projectImageUrl = uploadResult.data.url;
          console.log('[ProjectDetail] New image URL:', projectImageUrl);
        } else {
          console.error('[ProjectDetail] Image upload failed:', uploadResult.error);
          Alert.alert('Warning', 'Failed to upload new image. Other changes will still be saved.');
        }
      }

      const updateData: any = {
        owner_id: project.owner_id,  // Required for ownership verification
        description: editedDescription,
      };

      // Only include image URL if we have a new one
      if (newImageUri && projectImageUrl) {
        updateData.project_image_url = projectImageUrl;
        console.log('[ProjectDetail] Including new image URL in update');
      }

      console.log('[ProjectDetail] Updating project with data:', updateData);
      const result = await updateProject(project.id, updateData);
      console.log('[ProjectDetail] Update result:', result);
      
      if (result.error) {
        console.error('[ProjectDetail] Update failed:', result.error);
        Alert.alert('Error', result.error);
      } else {
        // Use the backend response data which includes the updated image URL
        if (result.data) {
          console.log('[ProjectDetail] Setting project from backend data:', result.data);
          setProject(result.data as ProjectData);
        } else {
          console.log('[ProjectDetail] No data in result, using manual update');
          // Fallback to manual update if no data returned
          setProject({ ...project, description: editedDescription, project_image_url: projectImageUrl });
        }
        setIsEditing(false);
        setNewImageUri(null);
        Alert.alert('Success', 'Project updated successfully');
      }
    } catch (error: any) {
      console.error('[ProjectDetail] Save error:', error);
      Alert.alert('Error', error.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!project) {
      Alert.alert('Error', 'Project data not loaded');
      console.error('[Delete] No project data available');
      return;
    }
    
    if (!project.owner_id) {
      Alert.alert('Error', 'Cannot delete: Missing owner information');
      console.error('[Delete] Missing owner_id. Project data:', JSON.stringify(project, null, 2));
      return;
    }
    
    if (!project.id) {
      Alert.alert('Error', 'Cannot delete: Missing project ID');
      console.error('[Delete] Missing project.id');
      return;
    }
    
    console.log('[Delete] Project data check:', {
      id: project.id,
      owner_id: project.owner_id,
      title: project.title
    });
    
    Alert.alert(
      'Delete Project',
      'Are you sure you want to permanently delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingProject(true);
            try {
              console.log('[Delete] Starting delete process...');
              console.log('[Delete] Project ID:', project.id);
              console.log('[Delete] Owner ID:', project.owner_id);
              
              const result = await deleteProject(project.id, project.owner_id);
              
              console.log('[Delete] API response:', JSON.stringify(result, null, 2));
              
              if (result.error) {
                console.error('[Delete] API returned error:', result.error);
                Alert.alert('Delete Failed', result.error);
              } else if (result.data) {
                console.log('[Delete] Delete successful!');
                Alert.alert(
                  'Success', 
                  'Project deleted successfully',
                  [
                    { 
                      text: 'OK', 
                      onPress: () => {
                        console.log('[Delete] Navigating to profile...');
                        router.push('/(tabs)/profile');
                      }
                    }
                  ]
                );
              } else {
                console.warn('[Delete] Unexpected response format:', result);
                Alert.alert('Warning', 'Deletion may have succeeded but response was unexpected');
              }
            } catch (error: any) {
              console.error('[Delete] Exception occurred:', error);
              console.error('[Delete] Error stack:', error.stack);
              Alert.alert('Error', error.message || 'Failed to delete project. Please try again.');
            } finally {
              setDeletingProject(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = async () => {
    if (!project) return;
    
    const newStatus = project.status === 'open' ? 'closed' : 'open';
    const statusLabel = newStatus === 'open' ? 'Open' : 'Closed';
    
    console.log('[ProjectDetail] Toggle status - current:', project.status, '-> new:', newStatus);
    
    Alert.alert(
      `${statusLabel} Project`,
      `Are you sure you want to mark this project as ${statusLabel.toLowerCase()}?${newStatus === 'closed' ? ' It will be hidden from discovery.' : ' It will be visible to others.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setStatusUpdating(true);
            try {
              console.log('[ProjectDetail] Calling updateProjectStatus API...');
              const result = await updateProjectStatus(project.id, newStatus, project.owner_id);
              
              console.log('[ProjectDetail] API result:', result);
              
              if (result.error) {
                console.error('[ProjectDetail] Status update failed:', result.error);
                Alert.alert('Error', result.error);
              } else {
                console.log('[ProjectDetail] Status updated successfully, updating local state');
                // Use backend response data if available
                if (result.data) {
                  setProject(result.data as ProjectData);
                } else {
                  setProject({ ...project, status: newStatus });
                }
                Alert.alert('Success', `Project marked as ${statusLabel.toLowerCase()}`);
              }
            } catch (error: any) {
              console.error('[ProjectDetail] Status update error:', error);
              Alert.alert('Error', error.message || 'Failed to update project status');
            } finally {
              setStatusUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleStatusSwitch = async () => {
    if (!project || statusUpdating) return;
    
    const newStatus = project.status === 'open' ? 'closed' : 'open';
    const previousStatus = project.status;
    
    console.log('[ProjectDetail] Switch toggle - current:', project.status, '-> new:', newStatus);
    
    // Optimistic update - update UI immediately
    setProject({ ...project, status: newStatus });
    setStatusUpdating(true);
    
    try {
      console.log('[ProjectDetail] Calling updateProjectStatus API...');
      const result = await updateProjectStatus(project.id, newStatus, project.owner_id);
      
      console.log('[ProjectDetail] API result:', result);
      
      if (result.error) {
        console.error('[ProjectDetail] Status update failed:', result.error);
        // Revert to previous status on error
        setProject({ ...project, status: previousStatus });
        Alert.alert('Error', result.error);
      } else {
        console.log('[ProjectDetail] Status updated successfully, updating local state');
        // Use backend response data if available
        if (result.data) {
          setProject(result.data as ProjectData);
        } else {
          setProject({ ...project, status: newStatus });
        }
      }
    } catch (error: any) {
      console.error('[ProjectDetail] Status update error:', error);
      // Revert to previous status on error
      setProject({ ...project, status: previousStatus });
      Alert.alert('Error', error.message || 'Failed to update project status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleExpressInterest = async () => {
    if (!project || !user || expressingInterest || expressedInterest) return;
    
    console.log('[ProjectDetail] Express interest button pressed');
    setExpressingInterest(true);
    
    try {
      // Get current user's profile ID
      const { exists, profile } = await checkProfileExists(user.id);
      if (!exists || !profile) {
        Alert.alert('Error', 'Profile not found. Please restart the app.');
        return;
      }
      
      console.log('[ProjectDetail] Profile found, sending interest to:', project.owner_id);
      
      const result = await expressInterest(project.id, profile.id, '');
      
      console.log('[ProjectDetail] Express interest result:', result);
      
      if (result.error) {
        console.error('[ProjectDetail] Express interest error:', result.error);
        if (result.error.includes('already expressed interest')) {
          setExpressedInterest(true);
          Alert.alert('Already Sent', 'You have already expressed interest in this project.');
        } else {
          Alert.alert('Error', result.error);
        }
      } else {
        console.log('[ProjectDetail] Express interest success');
        setExpressedInterest(true);
        Alert.alert('Interest Sent! 🎉', 'The project owner has been notified and can view your profile.');
      }
    } catch (error: any) {
      console.error('[ProjectDetail] Express interest catch error:', error);
      Alert.alert('Error', error.message || 'Failed to express interest');
    } finally {
      setExpressingInterest(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Project not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
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
          <Text style={styles.headerTitle}>Project Details</Text>
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero Image */}
        {newImageUri || project.project_image_url ? (
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: newImageUri || project.project_image_url }}
              style={styles.heroImage}
            />
            {isEditing && isOwner && (
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Text style={styles.changeImageText}>📷 Change Image</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.heroPlaceholderContainer}>
            <Text style={styles.heroPlaceholderText}>📁</Text>
            {isEditing && isOwner && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Text style={styles.addImageText}>📷 Add Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Title Section */}
        <View style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{project.title}</Text>
            {project.status && (
              <View style={[styles.statusBadge, project.status === 'closed' ? styles.statusBadgeClosed : styles.statusBadgeOpen]}>
                <Text style={styles.statusBadgeText}>
                  {project.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                </Text>
              </View>
            )}
          </View>
          {(project.owner_first_name || project.owner_last_name) && (
            <Text style={styles.owner}>
              Created by {project.owner_first_name || ''} {project.owner_last_name || ''}
            </Text>
          )}
          {project.similarity_score !== undefined && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>
                ✨ {Math.round(project.similarity_score * 100)}% Match
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagContainer}>
              {project.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Description</Text>
            {isOwner && (
              <View style={styles.editButtonContainer}>
                {isEditing && (
                  <TouchableOpacity
                    style={[styles.editIconButton, styles.cancelButton]}
                    onPress={() => {
                      setIsEditing(false);
                      setEditedDescription(project.description || '');
                      setNewImageUri(null);
                    }}
                  >
                    <Text style={styles.editIconText}>❌ Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.editIconButton}
                  onPress={() => {
                    if (isEditing) {
                      handleSaveDescription();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  <Text style={styles.editIconText}>{isEditing ? '💾 Save' : '✏️ Edit'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={[styles.descriptionText, styles.descriptionInput]}
              value={editedDescription}
              onChangeText={setEditedDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.descriptionText}>{project.description}</Text>
          )}
        </View>

        {/* Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>
          <View style={styles.infoCard}>
            {project.duration && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{project.duration}</Text>
              </View>
            )}
            {project.availability && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Availability:</Text>
                <Text style={styles.infoValue}>{project.availability}</Text>
              </View>
            )}
            {project.status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={styles.statusSwitchContainer}>
                  <Text style={[styles.statusLabel, project.status === 'closed' && styles.statusLabelInactive]}>
                    {project.status === 'open' ? 'Open' : 'Closed'}
                  </Text>
                  {isOwner && (
                    <Switch
                      value={project.status === 'open'}
                      onValueChange={handleToggleStatusSwitch}
                      disabled={statusUpdating}
                      trackColor={{ false: '#767577', true: '#10b981' }}
                      thumbColor={project.status === 'open' ? '#059669' : '#f4f3f4'}
                      ios_backgroundColor="#767577"
                    />
                  )}
                  {!isOwner && (
                    <Text style={[styles.infoValue, styles.statusBadge]}>
                      {project.status}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Dr Jekyll's Recommendations */}
        {project.roadmap && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Animated.View
                style={[
                  styles.jekyllIcon,
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
                <Image source={drJekyllIcon} style={styles.jekyllIconImage} resizeMode="contain" />
              </Animated.View>
              <Text style={styles.sectionTitle}>Dr Jekyll's Recommendations</Text>
            </View>
            <View style={styles.roadmapCard}>
              {/* Check for phases array format */}
              {project.roadmap.phases && Array.isArray(project.roadmap.phases) ? (
                project.roadmap.phases.map((phase: any, index: number) => (
                  <View key={index} style={styles.phaseCard}>
                    <Text style={styles.phaseTitle}>
                      Phase {index + 1}: {phase.title || phase.name}
                    </Text>
                    {phase.description && (
                      <Text style={styles.phaseDescription}>{phase.description}</Text>
                    )}
                    {phase.tasks && Array.isArray(phase.tasks) && (
                      <View style={styles.taskList}>
                        {phase.tasks.map((task: string, taskIndex: number) => (
                          <View key={taskIndex} style={styles.taskItem}>
                            <Text style={styles.taskBullet}>•</Text>
                            <Text style={styles.taskText}>{task}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              ) : /* Check for backend/frontend/database format */
              (project.roadmap.backend || project.roadmap.frontend || project.roadmap.database) ? (
                <>
                  {/* Display difficulty and estimated hours */}
                  {(project.roadmap.difficulty || project.roadmap.estimated_total_hours) && (
                    <View style={styles.roadmapSummary}>
                      {project.roadmap.difficulty && (
                        <Text style={styles.summaryText}>
                          Difficulty: <Text style={styles.summaryValue}>{project.roadmap.difficulty}</Text>
                        </Text>
                      )}
                      {project.roadmap.estimated_total_hours && (
                        <Text style={styles.summaryText}>
                          Total Hours: <Text style={styles.summaryValue}>{project.roadmap.estimated_total_hours}h</Text>
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Backend tasks */}
                  {project.roadmap.backend && Array.isArray(project.roadmap.backend) && project.roadmap.backend.length > 0 && (
                    <View style={styles.phaseCard}>
                      <Text style={styles.phaseTitle}>⚙️ Backend Development</Text>
                      <View style={styles.taskList}>
                        {project.roadmap.backend.map((task: any, index: number) => (
                          <View key={index} style={styles.taskItem}>
                            <Text style={styles.taskBullet}>•</Text>
                            <View style={styles.taskContent}>
                              <Text style={styles.taskText}>{task.task}</Text>
                              <View style={styles.taskMeta}>
                                <Text style={[styles.priorityBadge, getPriorityStyle(task.priority || 'medium')]}>
                                  {task.priority || 'medium'}
                                </Text>
                                {task.estimated_hours && (
                                  <Text style={styles.taskHours}>{task.estimated_hours}h</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Frontend tasks */}
                  {project.roadmap.frontend && Array.isArray(project.roadmap.frontend) && project.roadmap.frontend.length > 0 && (
                    <View style={styles.phaseCard}>
                      <Text style={styles.phaseTitle}>🎨 Frontend Development</Text>
                      <View style={styles.taskList}>
                        {project.roadmap.frontend.map((task: any, index: number) => (
                          <View key={index} style={styles.taskItem}>
                            <Text style={styles.taskBullet}>•</Text>
                            <View style={styles.taskContent}>
                              <Text style={styles.taskText}>{task.task}</Text>
                              <View style={styles.taskMeta}>
                                <Text style={[styles.priorityBadge, getPriorityStyle(task.priority || 'medium')]}>
                                  {task.priority || 'medium'}
                                </Text>
                                {task.estimated_hours && (
                                  <Text style={styles.taskHours}>{task.estimated_hours}h</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Database tasks */}
                  {project.roadmap.database && Array.isArray(project.roadmap.database) && project.roadmap.database.length > 0 && (
                    <View style={styles.phaseCard}>
                      <Text style={styles.phaseTitle}>💾 Database & Infrastructure</Text>
                      <View style={styles.taskList}>
                        {project.roadmap.database.map((task: any, index: number) => (
                          <View key={index} style={styles.taskItem}>
                            <Text style={styles.taskBullet}>•</Text>
                            <View style={styles.taskContent}>
                              <Text style={styles.taskText}>{task.task}</Text>
                              <View style={styles.taskMeta}>
                                <Text style={[styles.priorityBadge, getPriorityStyle(task.priority || 'medium')]}>
                                  {task.priority || 'medium'}
                                </Text>
                                {task.estimated_hours && (
                                  <Text style={styles.taskHours}>{task.estimated_hours}h</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              ) : (
                /* Fallback for other formats */
                <Text style={styles.roadmapText}>
                  {typeof project.roadmap === 'string' 
                    ? project.roadmap 
                    : JSON.stringify(project.roadmap, null, 2)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity 
              style={[styles.deleteButton, deletingProject && styles.buttonDisabled]} 
              activeOpacity={0.8}
              onPress={handleDeleteProject}
              disabled={deletingProject}
            >
              <Text style={styles.deleteButtonText}>
                {deletingProject ? '⏳ Deleting...' : '🗑️ Delete Project'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isDenied ? (
          <View style={styles.deniedBanner}>
            <Text style={styles.deniedBannerText}>❌ Your request to join this project was not accepted.</Text>
            <Text style={styles.deniedBannerSub}>The project owner can reverse this decision at any time.</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, (expressedInterest || expressingInterest) && styles.buttonDisabled]} 
            activeOpacity={0.8}
            onPress={handleExpressInterest}
            disabled={expressedInterest || expressingInterest}
          >
            <Text style={styles.actionButtonText}>
              {expressingInterest ? '⏳ Sending...' : (expressedInterest ? '✓ Interest Sent' : '💌 Express Interest')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
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
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
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
  emptyText: {
    fontSize: 16,
    color: '#78716c',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  heroImageContainer: {
    width: '100%',
    height: 280,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  heroPlaceholderContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: 120,
    opacity: 0.3,
  },
  addImageButton: {
    position: 'absolute',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  titleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginTop: -60,
    borderRadius: 28,
    padding: 28,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#065f46',
    letterSpacing: -1,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  statusSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  statusLabelInactive: {
    color: '#ef4444',
  },
  statusBadgeOpen: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },
  statusBadgeClosed: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  owner: {
    fontSize: 14,
    color: '#78716c',
    marginBottom: 12,
  },
  matchBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#fcd34d',
  },
  matchText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  section: {
    marginBottom: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jekyllIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#065f46',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    marginRight: 16,
  },
  jekyllIconImage: {
    width: '100%',
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  editIconButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  editIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#44403c',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78716c',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#44403c',
  },
  roadmapCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  phaseCard: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 8,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#78716c',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskList: {
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  taskBullet: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 8,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: '#44403c',
    lineHeight: 20,
  },
  taskContent: {
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    alignItems: 'center',
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  priority_high: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  priority_medium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  priority_low: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  taskHours: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
  },
  roadmapSummary: {
    backgroundColor: 'rgba(209, 250, 229, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: '800',
    color: '#10B981',
  },
  roadmapText: {
    fontSize: 14,
    color: '#44403c',
    lineHeight: 20,
  },
  ownerActions: {
    marginTop: 20,
    gap: 12,
  },
  statusButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#059669',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#059669',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#991b1b',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  deniedBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fca5a5',
    gap: 4,
  },
  deniedBannerText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  deniedBannerSub: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
});
