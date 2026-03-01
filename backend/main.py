"""
FastAPI Backend for Project Jekyll & Hyde
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import logging
import google.generativeai as genai

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


class ProfileResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    major: Optional[str]
    skills: Optional[List[str]]
    experience_level: Optional[str]


class ProjectCreate(BaseModel):
    owner_id: str
    title: str
    description: str
    tags: Optional[List[str]] = []


class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    tags: Optional[List[str]]
    roadmap: Optional[Dict[str, Any]]
    status: str


class MatchRequest(BaseModel):
    profile_id: Optional[str] = None
    project_id: Optional[str] = None
    match_threshold: float = 0.7
    match_limit: int = 10


# Health check
@app.get("/")
async def root():
    logger.info("Health check endpoint called")
    return {
        "message": "Welcome to Project Jekyll & Hyde API",
        "status": "operational",
        "version": "1.0.0"
    }


# Create Profile Endpoint
@app.post("/profile", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(profile: ProfileCreate):
    """
    Create a new user profile with AI-generated embedding for semantic matching.
    """
    try:
        # Generate bio text for embedding
        bio_text = f"{profile.major or ''} {profile.interests or ''} {' '.join(profile.skills or [])}".strip()
        
        # Generate embedding using Gemini
        bio_embedding = await generate_embedding(bio_text)
        
        # Insert into Supabase
        data = profile.dict()
        data['bio_embedding'] = bio_embedding
        
        response = supabase.table("profiles").insert(data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create profile"
            )
        
        return response.data[0]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating profile: {str(e)}"
        )


# Create Project Endpoint
@app.post("/project", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate):
    """
    Create a new project with AI-generated roadmap and embedding for semantic matching.
    """
    try:
        # Generate project roadmap using Gemini
        roadmap = await generate_project_roadmap(project.title, project.description)
        
        # Generate embedding for semantic matching
        project_text = f"{project.title} {project.description} {' '.join(project.tags or [])}".strip()
        project_embedding = await generate_embedding(project_text)
        
        # Insert into Supabase
        data = project.dict()
        data['roadmap'] = roadmap
        data['project_embedding'] = project_embedding
        data['status'] = 'open'
        
        response = supabase.table("projects").insert(data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project"
            )
        
        return response.data[0]
    
    except Exception as e:
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
