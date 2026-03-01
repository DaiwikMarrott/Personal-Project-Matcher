/**
 * API Service Layer
 * Handles all communication with the FastAPI backend
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
console.log('[API] API_BASE_URL initialized:', API_BASE_URL);

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Profile Types
export interface Profile {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  major?: string;
  interests?: string;
  skills?: string[];
  experience_level?: string;
  availability?: any;
  urls?: { [key: string]: string };
  profile_picture_url?: string;
  availability_hours_per_week?: number;
  project_size_preference?: string;
  project_duration_preference?: string;
  collaboration_style?: string;
  profile_ai_summary?: string;
}

export interface ProfileCreate {
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  language?: string;
  major?: string;
  interests?: string;
  skills?: string[];
  experience_level?: string;
  availability?: any;
  urls?: { [key: string]: string };
  profile_picture_url?: string;
  availability_hours_per_week?: number;
  project_size_preference?: string;
  project_duration_preference?: string;
  collaboration_style?: string;
}

// Project Types
export interface Project {
  id: string;
  owner_id: string;
  owner_first_name?: string;
  owner_last_name?: string;
  title: string;
  description: string;
  tags?: string[];
  duration?: string;
  availability_needed?: string;
  project_image_url?: string;
  roadmap?: any;
  status?: string;
  project_ai_summary?: string;
  similarity_score?: number;
}

export interface ProjectCreate {
  owner_id: string;
  title: string;
  description: string;
  tags?: string[];
  duration?: string;
  availability_needed?: string;
  project_image_url?: string;
}

// API Functions

/**
 * Upload avatar image
 */
export async function uploadAvatar(userId: string, file: Blob): Promise<ApiResponse<{ url: string }>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-avatar/${userId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to upload avatar' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Upload project image
 */
export async function uploadProjectImage(userId: string, file: Blob): Promise<ApiResponse<{ url: string }>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-project-image/${userId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to upload project image' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if user has a profile
 */
export async function checkProfileExists(authUserId: string): Promise<ApiResponse<{ exists: boolean; profile?: Profile }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/check/${authUserId}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to check profile' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new profile
 */
export async function createProfile(profile: ProfileCreate): Promise<ApiResponse<Profile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to create profile' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update an existing profile
 */
export async function updateProfile(authUserId: string, updates: Partial<ProfileCreate>): Promise<ApiResponse<Profile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${authUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to update profile' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get profile by ID
 */
export async function getProfile(profileId: string): Promise<ApiResponse<Profile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${profileId}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to get profile' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectCreate): Promise<ApiResponse<Project>> {
  try {
    const response = await fetch(`${API_BASE_URL}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to create project' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get project by ID
 */
export async function getProject(projectId: string): Promise<ApiResponse<Project>> {
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectId}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to get project' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all projects with optional filters
 */
export async function getProjects(filters?: { 
  status?: string;
  owner_id?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<Project[]>> {
  try {
    const params = new URLSearchParams();
    // Always add status parameter if provided (even if empty string)
    if (filters?.status !== undefined) params.append('project_status', filters.status);
    if (filters?.owner_id) params.append('owner_id', filters.owner_id);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = `${API_BASE_URL}/projects${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to get projects' };
    }

    const data = await response.json();
    // Backend returns { projects: [...], count: ... }
    return { data: data.projects || [] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get recommended projects for a profile
 */
export async function getRecommendedProjects(profileId: string, limit: number = 10): Promise<ApiResponse<Project[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/recommended-projects/${profileId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to get recommended projects' };
    }

    const data = await response.json();
    // Backend returns { recommended_projects: [...] }
    return { data: data.recommended_projects || [] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Find matches (projects or profiles)
 */
export async function findMatches(params: {
  profile_id?: string;
  project_id?: string;
  match_threshold?: number;
  match_limit?: number;
}): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to find matches' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update project
 */
export async function updateProject(projectId: string, updates: Partial<ProjectCreate>): Promise<ApiResponse<Project>> {
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to update project' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  projectId: string, 
  status: string, 
  ownerId: string
): Promise<ApiResponse<Project>> {
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, owner_id: ownerId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to update project status' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string, 
  ownerId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ owner_id: ownerId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to delete project' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Notification types
 */
export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  project_id?: string;
  notification_type: string;
  message?: string;
  read: boolean;
  created_at: string;
  reference_id?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_profile_picture_url?: string;
  sender_skills?: string[];
  sender_interests?: string;
  sender_experience_level?: string;
  project_title?: string;
}

/**
 * Express interest in a project
 */
export async function expressInterest(
  projectId: string,
  senderId: string,
  message?: string
): Promise<ApiResponse<{ success: boolean; message: string; notification: Notification }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectId}/express-interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sender_id: senderId,
        message: message || ''
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to express interest' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  profileId: string,
  unreadOnly: boolean = false
): Promise<ApiResponse<{ notifications: Notification[]; count: number }>> {
  try {
    const url = `${API_BASE_URL}/notifications/${profileId}${unreadOnly ? '?unread_only=true' : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch notifications' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<ApiResponse<{ success: boolean; notification: Notification }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to mark notification as read' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(
  profileId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${profileId}/mark-all-read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to mark all notifications as read' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ─── Request Review ───────────────────────────────────────────────────────────

export interface RequestDetails {
  notification: Notification;
  requester: Profile;
  project: Project;
}

export async function getRequestDetails(
  notificationId: string
): Promise<ApiResponse<RequestDetails>> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/request-details`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch request details' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function approveRequest(
  projectId: string,
  requesterId: string,
  ownerId: string,
  notificationId: string
): Promise<ApiResponse<{ success: boolean; chat_id: string; message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/approve/${requesterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_id: ownerId, notification_id: notificationId }),
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to approve request' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function denyRequest(
  projectId: string,
  requesterId: string,
  ownerId: string,
  notificationId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/deny/${requesterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_id: ownerId, notification_id: notificationId }),
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to deny request' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface DeniedUser {
  id: string;
  project_id: string;
  denied_user_id: string;
  denied_at: string;
  denied_user?: Profile;
}

export async function getProjectDenials(
  projectId: string,
  ownerId: string
): Promise<ApiResponse<{ denials: DeniedUser[]; count: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/denials?owner_id=${ownerId}`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch denials' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function removeProjectDenial(
  projectId: string,
  userId: string,
  ownerId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/denials/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_id: ownerId }),
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to remove denial' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getDeniedProjectIds(
  profileId: string
): Promise<ApiResponse<{ denied_project_ids: string[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${profileId}/denied-project-ids`);
    if (!response.ok) {
      return { error: 'Failed to fetch denied project ids' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Chat {
  id: string;
  project_id?: string;
  project_title?: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  last_message_at: string;
  other_participant?: Profile;
  last_message?: { content: string; created_at: string; sender_id: string };
  unread_count?: number;
}

export async function getUserChats(
  profileId: string
): Promise<ApiResponse<{ chats: Chat[]; count: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${profileId}/chats`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch chats' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getChatMessages(
  chatId: string,
  profileId: string
): Promise<ApiResponse<{ messages: ChatMessage[]; count: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages?profile_id=${profileId}`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch messages' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendChatMessage(
  chatId: string,
  senderId: string,
  content: string
): Promise<ApiResponse<{ success: boolean; message: ChatMessage }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: senderId, content }),
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to send message' };
    }
    return { data: await response.json() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

