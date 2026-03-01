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
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { updateProject, deleteProject } from '@/services/api';

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

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    try {
      // In a real implementation, you would fetch project details from the API
      // For now, we'll reconstruct from passed params
      if (params.projectData && typeof params.projectData === 'string') {
        const projectData = JSON.parse(params.projectData);
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

  const handleSaveDescription = async () => {
    if (!project) return;
    
    try {
      const result = await updateProject(project.id, {
        owner_id: project.owner_id,  // Required for ownership verification
        description: editedDescription,
      });
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setProject({ ...project, description: editedDescription });
        setIsEditing(false);
        Alert.alert('Success', 'Project updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteProject(project.id, project.owner_id);
              
              if (result.error) {
                Alert.alert('Error', result.error);
              } else {
                Alert.alert('Success', 'Project deleted successfully', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete project');
            }
          }
        }
      ]
    );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.headerTitle}>Projects Matcher</Text>
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero Image */}
        {project.project_image_url ? (
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: project.project_image_url }}
              style={styles.heroImage}
            />
          </View>
        ) : (
          <View style={styles.heroPlaceholderContainer}>
            <Text style={styles.heroPlaceholderText}>📁</Text>
          </View>
        )}

        {/* Title Section */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>{project.title}</Text>
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
                <Text style={[styles.infoValue, styles.statusBadge]}>
                  {project.status}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Roadmap */}
        {project.roadmap && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗺️ AI-Generated Roadmap</Text>
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
          <TouchableOpacity 
            style={styles.deleteButton} 
            activeOpacity={0.8}
            onPress={handleDeleteProject}
          >
            <Text style={styles.deleteButtonText}>🗑️ Delete Project</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>Express Interest</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#e6f7ed',
    borderBottomWidth: 2,
    borderBottomColor: '#a7f3d0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#065f46',
    marginBottom: 12,
    letterSpacing: -1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editIconButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6ee7b7',
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
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
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
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#991b1b',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
