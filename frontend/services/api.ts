/**
 * API Service Layer
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

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
    if (filters?.status) params.append('project_status', filters.status); // Note: backend uses project_status
    if (filters?.owner_id) params.append('owner_id', filters.owner_id);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = `${API_BASE_URL}/projects${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
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
    const response = await fetch(`${API_BASE_URL}/recommended-projects/${profileId}?limit=${limit}`);
    
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
