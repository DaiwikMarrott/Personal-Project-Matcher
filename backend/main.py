"""
FastAPI Backend for Project Jekyll & Hyde
"""
from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import logging
import google.generativeai as genai
import base64
import mimetypes

from ai_service import generate_project_roadmap, generate_embedding

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Project Jekyll & Hyde API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY environment variable")

genai.configure(api_key=GEMINI_API_KEY)


# Pydantic Models
class ProfileCreate(BaseModel):
    auth_user_id: str  # Supabase auth.users ID
    first_name: str
    last_name: str
    email: EmailStr
    language: str = "en"
    major: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_level: Optional[str] = "beginner"
    availability: Optional[Dict[str, Any]] = {}
    urls: Optional[Dict[str, str]] = {}
    profile_picture_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    major: Optional[str]
    skills: Optional[List[str]]
    experience_level: Optional[str]
    profile_picture_url: Optional[str]
    interests: Optional[str]
    availability: Optional[Dict[str, Any]]
    urls: Optional[Dict[str, str]]


class ProjectCreate(BaseModel):
    owner_id: str  # Can be either profile.id or auth_user_id (will be looked up)
    title: str
    description: str
    tags: Optional[List[str]] = []
    duration: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    tags: Optional[List[str]]
    duration: Optional[str]
    roadmap: Optional[Dict[str, Any]]
    status: str


class MatchRequest(BaseModel):
    profile_id: Optional[str] = None
    project_id: Optional[str] = None
    match_threshold: float = 0.7
    match_limit: int = 10


class ProjectStatusUpdate(BaseModel):
    status: str
    owner_id: str  # For verification


# Health check
@app.get("/")
async def root():
    logger.info("Health check endpoint called")
    return {
        "message": "Welcome to Project Jekyll & Hyde API",
        "status": "operational",
        "version": "1.0.0"
    }


# Upload Profile Picture
@app.post("/upload-avatar/{user_id}")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    """
    Upload a profile picture to Supabase Storage.
    Returns the public URL of the uploaded image.
    """
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Use JPEG, PNG, WebP, or GIF."
            )
        
        # Validate file size (5MB max)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        # Upload to Supabase Storage
        file_path = f"{user_id}/avatar.jpg"
        
        try:
            storage_response = supabase.storage.from_("avatars").upload(
                file_path,
                file_content,
                {"content-type": file.content_type, "upsert": "true"}
            )
            
            logger.info(f"Storage response: {storage_response}")
            
        except Exception as storage_error:
            logger.error(f"Storage upload error: {str(storage_error)}")
            # Check if it's a bucket/policy issue
            if "not found" in str(storage_error).lower():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Storage bucket not configured. Please run STORAGE_POLICIES.sql in Supabase SQL Editor."
                )
            raise
        
        # Get public URL
        public_url = supabase.storage.from_("avatars").get_public_url(file_path)
        
        logger.info(f"Successfully uploaded avatar for user {user_id}, URL: {public_url}")
        
        return {
            "url": public_url,
            "message": "Avatar uploaded successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading avatar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading avatar: {str(e)}"
        )


# Check if user has profile
@app.get("/profile/check/{auth_user_id}")
async def check_profile_exists(auth_user_id: str):
    """
    Check if a user has created a profile.
    Returns profile data if exists, or indicates profile doesn't exist.
    """
    try:
        response = supabase.table("profiles").select("*").eq("auth_user_id", auth_user_id).execute()
        
        if response.data and len(response.data) > 0:
            return {
                "exists": True,
                "profile": response.data[0]
            }
        else:
            return {
                "exists": False,
                "profile": None
            }
    
    except Exception as e:
        logger.error(f"Error checking profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking profile: {str(e)}"
        )


# Create Profile Endpoint
@app.post("/profile", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(profile: ProfileCreate):
    """
    Create a new user profile with AI-generated embedding for semantic matching.
    The auth_user_id should match the Supabase auth.users.id.
    """
    try:
        logger.info(f"Creating profile for user {profile.auth_user_id}")
        
        # Check if profile already exists
        existing = supabase.table("profiles").select("id").eq("auth_user_id", profile.auth_user_id).execute()
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists for this user"
            )
        
        # Generate bio text for embedding
        bio_text = f"{profile.major or ''} {profile.interests or ''} {' '.join(profile.skills or [])}".strip()
        
        # Generate embedding using Gemini
        bio_embedding = await generate_embedding(bio_text) if bio_text else None
        
        # Insert into Supabase
        data = profile.dict()
        if bio_embedding:
            data['bio_embedding'] = bio_embedding
        
        response = supabase.table("profiles").insert(data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create profile"
            )
        
        logger.info(f"Successfully created profile with ID {response.data[0]['id']}")
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating profile: {str(e)}"
        )


# Create Project Endpoint
@app.post("/project", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate):
    """
    Create a new project with AI-generated roadmap and embedding for semantic matching.
    owner_id can be either the profile.id or auth_user_id (will be looked up automatically).
    """
    try:
        logger.info(f"Creating project for owner_id: {project.owner_id}")
        
        # First, try to look up the profile by owner_id (could be profile.id or auth_user_id)
        profile_response = supabase.table("profiles").select("id").eq("id", project.owner_id).execute()
        
        if not profile_response.data or len(profile_response.data) == 0:
            # If not found by profile.id, try looking up by auth_user_id
            logger.info(f"Profile not found by id, trying auth_user_id lookup")
            profile_response = supabase.table("profiles").select("id").eq("auth_user_id", project.owner_id).execute()
        
        if not profile_response.data or len(profile_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile not found for owner_id: {project.owner_id}. Please create your profile first at /profile endpoint."
            )
        
        actual_profile_id = profile_response.data[0]['id']
        logger.info(f"Resolved profile.id: {actual_profile_id}")
        
        # Generate project roadmap using Gemini
        logger.info("Generating AI roadmap...")
        roadmap = await generate_project_roadmap(project.title, project.description)
        
        # Generate embedding for semantic matching
        logger.info("Generating embeddings...")
        project_text = f"{project.title} {project.description} {' '.join(project.tags or [])}".strip()
        project_embedding = await generate_embedding(project_text)
        
        # Insert into Supabase with the actual profile.id
        data = project.dict()
        data['owner_id'] = actual_profile_id  # Use the resolved profile.id
        data['roadmap'] = roadmap
        data['project_embedding'] = project_embedding
        data['status'] = 'open'
        
        logger.info("Inserting project into database...")
        response = supabase.table("projects").insert(data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project"
            )
        
        logger.info(f"Project created successfully with id: {response.data[0]['id']}")
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating project: {str(e)}"
        )


# Match Endpoint
@app.post("/match")
async def find_matches(match_request: MatchRequest):
    """
    Find matching profiles for a project OR matching projects for a profile
    using cosine similarity on embeddings via Supabase RPC.
    """
    try:
        if match_request.project_id:
            # Find matching profiles for a project
            response = supabase.rpc(
                "match_profiles_to_project",
                {
                    "project_uuid": match_request.project_id,
                    "match_threshold": match_request.match_threshold,
                    "match_limit": match_request.match_limit
                }
            ).execute()
            
            return {
                "type": "profiles",
                "project_id": match_request.project_id,
                "matches": response.data or []
            }
        
        elif match_request.profile_id:
            # Find matching projects for a profile
            response = supabase.rpc(
                "match_projects_to_profile",
                {
                    "profile_uuid": match_request.profile_id,
                    "match_threshold": match_request.match_threshold,
                    "match_limit": match_request.match_limit
                }
            ).execute()
            
            return {
                "type": "projects",
                "profile_id": match_request.profile_id,
                "matches": response.data or []
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either profile_id or project_id must be provided"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error finding matches: {str(e)}"
        )


# Get Profile by ID
@app.get("/profile/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: str):
    """Get a profile by ID"""
    try:
        response = supabase.table("profiles").select("*").eq("id", profile_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching profile: {str(e)}"
        )


# Get Project by ID
@app.get("/project/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get a project by ID"""
    try:
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching project: {str(e)}"
        )


# Update project status (close/reopen)
@app.patch("/project/{project_id}/status", response_model=ProjectResponse)
async def update_project_status(project_id: str, status_update: ProjectStatusUpdate):
    """Update project status (close/reopen) - only owner can update"""
    try:
        # Verify the project exists and check ownership
        project_response = supabase.table("projects").select("*").eq("id", project_id).execute()
        
        if not project_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = project_response.data[0]
        
        # Verify ownership
        if project['owner_id'] != status_update.owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the project owner can update the status"
            )
        
        # Validate status
        valid_statuses = ['open', 'in-progress', 'completed', 'closed']
        if status_update.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Update the status
        update_response = supabase.table("projects").update({
            "status": status_update.status,
            "updated_at": "NOW()"
        }).eq("id", project_id).execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update project status"
            )
        
        return update_response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating project status: {str(e)}"
        )


# Get all projects (with optional filtering)
@app.get("/projects")
async def get_projects(project_status: Optional[str] = "open", limit: int = 50):
    """Get all projects with optional status filter"""
    logger.info(f"Fetching projects with status={project_status}, limit={limit}")
    try:
        query = supabase.table("projects").select("*")
        
        if project_status:
            query = query.eq("status", project_status)
        
        response = query.limit(limit).execute()
        
        logger.info(f"Successfully fetched {len(response.data) if response.data else 0} projects")
        
        return {
            "projects": response.data or [],
            "count": len(response.data) if response.data else 0
        }
    
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching projects: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
