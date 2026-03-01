"""
AI Service for Project Jekyll & Hyde
Handles AI tasks: roadmap generation and embeddings using Google Gemini
"""
import google.generativeai as genai
import json
from typing import Dict, Any, List
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


async def generate_project_roadmap(title: str, description: str) -> Dict[str, Any]:
    """
    Use Google Gemini to generate a structured technical roadmap for a project.
    
    Args:
        title: Project title
        description: Project description
    
    Returns:
        A JSON roadmap with Frontend, Backend, and Database tasks
    """
    try:
        # Create the prompt for roadmap generation
        prompt = f"""
You are Dr. Jekyll, an expert technical mentor. Given a project idea, generate a detailed technical roadmap.

Project Title: {title}
Project Description: {description}

Generate a comprehensive technical roadmap in JSON format with the following structure:
{{
    "frontend": [
        {{"task": "Task description", "priority": "high/medium/low", "estimated_hours": number}}
    ],
    "backend": [
        {{"task": "Task description", "priority": "high/medium/low", "estimated_hours": number}}
    ],
    "database": [
        {{"task": "Task description", "priority": "high/medium/low", "estimated_hours": number}}
    ],
    "deployment": [
        {{"task": "Task description", "priority": "high/medium/low", "estimated_hours": number}}
    ],
    "recommended_stack": {{
        "frontend": ["technology1", "technology2"],
        "backend": ["technology1", "technology2"],
        "database": ["technology1"]
    }},
    "estimated_total_hours": number,
    "difficulty": "beginner/intermediate/advanced"
}}

Be specific and actionable. Consider real-world implementation challenges.
Return ONLY valid JSON, no markdown formatting or explanations.
"""
        
        # Use Gemini to generate the roadmap
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Parse the response
        roadmap_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if roadmap_text.startswith("```"):
            roadmap_text = roadmap_text.split("```")[1]
            if roadmap_text.startswith("json"):
                roadmap_text = roadmap_text[4:]
            roadmap_text = roadmap_text.strip()
        
        roadmap = json.loads(roadmap_text)
        
        return roadmap
    
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from Gemini: {e}")
        # Return a fallback roadmap
        return {
            "frontend": [
                {"task": "Design user interface mockups", "priority": "high", "estimated_hours": 8},
                {"task": "Implement core UI components", "priority": "high", "estimated_hours": 16}
            ],
            "backend": [
                {"task": "Set up API endpoints", "priority": "high", "estimated_hours": 12},
                {"task": "Implement business logic", "priority": "high", "estimated_hours": 20}
            ],
            "database": [
                {"task": "Design database schema", "priority": "high", "estimated_hours": 6},
                {"task": "Set up migrations", "priority": "medium", "estimated_hours": 4}
            ],
            "deployment": [
                {"task": "Configure hosting environment", "priority": "medium", "estimated_hours": 6}
            ],
            "recommended_stack": {
                "frontend": ["React", "TypeScript"],
                "backend": ["FastAPI", "Python"],
                "database": ["PostgreSQL"]
            },
            "estimated_total_hours": 72,
            "difficulty": "intermediate"
        }
    
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        raise


async def generate_embedding(text: str) -> List[float]:
    """
    Generate a 768-dimensional embedding vector using Google Gemini.
    
    Args:
        text: Text to generate embedding for
    
    Returns:
        A list of floats representing the embedding vector
    """
    try:
        if not text or not text.strip():
            # Return zero vector for empty text
            return [0.0] * 768
        
        # Use Gemini's embedding model
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="semantic_similarity"
        )
        
        embedding = result['embedding']
        
        # Ensure it's 768 dimensions (pad or truncate if necessary)
        if len(embedding) < 768:
            embedding.extend([0.0] * (768 - len(embedding)))
        elif len(embedding) > 768:
            embedding = embedding[:768]
        
        return embedding
    
    except Exception as e:
        print(f"Error generating embedding: {e}")
        # Return zero vector as fallback
        return [0.0] * 768


async def generate_hype_audio_script(profile_text: str, mode: str = "roast") -> str:
    """
    Generate a script for Mr. Hyde (the hype-man) to either roast or hype up content.
    This script can then be sent to ElevenLabs for voice generation.
    
    Args:
        profile_text: The profile or project text to analyze
        mode: Either "roast" (for boring profiles) or "hype" (for exciting projects)
    
    Returns:
        A script text for audio generation
    """
    try:
        if mode == "roast":
            prompt = f"""
You are Mr. Hyde, a brutally honest but hilarious roast master. Your job is to call out boring, generic, or vague profiles in a funny way that motivates people to improve them.

Profile Text: {profile_text}

Generate a short, punchy roast (2-3 sentences max) that:
- Points out specific weaknesses in the profile
- Uses humor and wit
- Ends with constructive motivation to improve

Keep it fun and light-hearted, not mean-spirited.
"""
        else:  # hype mode
            prompt = f"""
You are Mr. Hyde, an incredibly enthusiastic hype-man who gets PUMPED about amazing projects. Your job is to generate excitement and attract collaborators.

Project Text: {profile_text}

Generate a short, energetic hype script (2-3 sentences max) that:
- Highlights what makes this project exciting
- Creates FOMO (fear of missing out)
- Encourages people to join the team

Use high-energy language. Be enthusiastic but authentic.
"""
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return response.text.strip()
    
    except Exception as e:
        print(f"Error generating hype script: {e}")
        if mode == "roast":
            return "Your profile is so generic, it could be anyone. Spice it up!"
        else:
            return "This project is incredible! Join the team and build something amazing!"
