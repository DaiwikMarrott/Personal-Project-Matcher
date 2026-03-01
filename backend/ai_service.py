"""
AI Service for Project Jekyll & Hyde
Handles AI tasks: roadmap generation, embeddings, and voice generation
"""
import google.generativeai as genai
import json
from typing import Dict, Any, List
import os
from dotenv import load_dotenv
from elevenlabs import ElevenLabs, VoiceSettings
import base64

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Configure ElevenLabs
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
elevenlabs_client = None
if ELEVENLABS_API_KEY:
    elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)


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
        # Using gemini-flash-latest - reliable production model
        model = genai.GenerativeModel('models/gemini-flash-latest')
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
        # gemini-embedding-001 (768 dimensions)
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="retrieval_document"
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
        
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        return response.text.strip()
    
    except Exception as e:
        print(f"Error generating hype script: {e}")
        if mode == "roast":
            return "Your profile is so generic, it could be anyone. Spice it up!"
        else:
            return "This project is incredible! Join the team and build something amazing!"


async def generate_hyde_voice(script_text: str) -> bytes:
    """
    Generate voice audio from text using ElevenLabs.
    Uses a sassy, energetic voice for Mr. Hyde.
    
    Args:
        script_text: The text to convert to speech
    
    Returns:
        Audio bytes (MP3 format)
    """
    try:
        print(f"[Hyde Voice] Starting audio generation for script: {script_text[:50]}...")
        
        if not elevenlabs_client:
            raise Exception("ElevenLabs API key not configured")
        
        print("[Hyde Voice] ElevenLabs client configured")
        
        # Generate voice using ElevenLabs
        # Voice ID: Adam - deep, authoritative voice with evil undertone
        print("[Hyde Voice] Calling ElevenLabs API...")
        audio_generator = elevenlabs_client.text_to_speech.convert(
            voice_id="pNInz6obpgDQGcFmaJgB",  # Adam - deep voice
            text=script_text,
            model_id="eleven_turbo_v2_5",  # Turbo model for faster speech
            voice_settings=VoiceSettings(
                stability=0.35,  # Lower for more dramatic, menacing variation
                similarity_boost=0.85,  # Higher to maintain voice character
                style=1.0,  # Maximum expressiveness for evil tone
                use_speaker_boost=True
            )
        )
        
        print("[Hyde Voice] Collecting audio chunks...")
        # Collect audio chunks
        audio_bytes = b""
        chunk_count = 0
        for chunk in audio_generator:
            if isinstance(chunk, bytes):
                audio_bytes += chunk
                chunk_count += 1
        
        print(f"[Hyde Voice] Collected {chunk_count} chunks, total size: {len(audio_bytes)} bytes")
        
        if len(audio_bytes) == 0:
            raise Exception("No audio data generated")
        
        return audio_bytes
    
    except Exception as e:
        print(f"[Hyde Voice] Error generating voice: {e}")
        import traceback
        traceback.print_exc()
        raise


async def generate_hyde_verdict(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate Mr. Hyde's complete verdict on a profile.
    Analyzes the profile and returns both the script and audio.
    
    Args:
        profile_data: Dictionary containing profile information
    
    Returns:
        Dictionary with 'script' (text) and 'audio' (base64 encoded MP3)
    """
    try:
        # Build profile summary
        profile_parts = []
        if profile_data.get('first_name'):
            profile_parts.append(f"Name: {profile_data['first_name']}")
        if profile_data.get('major'):
            profile_parts.append(f"Major: {profile_data['major']}")
        if profile_data.get('skills'):
            skills_str = ', '.join(profile_data['skills']) if isinstance(profile_data['skills'], list) else profile_data['skills']
            profile_parts.append(f"Skills: {skills_str}")
        if profile_data.get('interests'):
            profile_parts.append(f"Interests: {profile_data['interests']}")
        if profile_data.get('experience_level'):
            profile_parts.append(f"Experience: {profile_data['experience_level']}")
        
        profile_text = ". ".join(profile_parts)
        
        # Determine if profile is bland or good
        # Bland = missing key fields or very generic content
        is_bland = (
            not profile_data.get('skills') or 
            (isinstance(profile_data.get('skills'), list) and len(profile_data['skills']) < 2) or
            not profile_data.get('interests') or
            len(profile_data.get('interests', '')) < 20
        )
        
        # Generate script
        mode = "roast" if is_bland else "hype"
        
        # Create a more profile-specific prompt
        if mode == "roast":
            prompt = f"""
You are Mr. Hyde, a brutally honest but hilarious roast master who helps people improve their profiles. You're sassy, witty, and always constructive.

Profile to roast: {profile_text}

Generate a SHORT, punchy roast (2-3 sentences max) that:
- Points out what's missing or too vague
- Uses humor and sass (not mean-spirited)
- Ends with motivation to improve
- Keep it under 50 words

Examples of your style:
- "Okay, 'computer science' and 'coding' - groundbreaking stuff. Every other CS student says that. What makes YOU different? Add your actual projects!"
- "Your interests are more generic than a stock photo. 'Technology'? Really? Get specific or get ignored!"
"""
        else:
            prompt = f"""
You are Mr. Hyde, an enthusiastic hype-man who gets genuinely excited about impressive profiles. You're energetic and genuine.

Profile to hype up: {profile_text}

Generate a SHORT, energetic hype script (2-3 sentences max) that:
- Highlights specific strengths
- Creates excitement about collaborating with this person
- Sounds genuinely impressed
- Keep it under 50 words

Examples of your style:
- "Now THIS is what I'm talking about! Machine learning AND mobile dev? You're the complete package. Projects are gonna be fighting over you!"
- "Finally, someone who knows their stuff! That skill set is exactly what teams are looking for. You're going places!"
"""
        
        print(f"[Hyde Verdict] Generating script with mode: {mode}")
        model = genai.GenerativeModel('models/gemini-flash-latest')
        response = model.generate_content(prompt)
        script = response.text.strip()
        
        # Remove any quotes that Gemini might add
        script = script.replace('"', '').replace('"', '').replace('"', '')
        print(f"[Hyde Verdict] Generated script: {script}")
        
        # Generate voice audio
        print("[Hyde Verdict] Generating voice audio...")
        audio_bytes = await generate_hyde_voice(script)
        print(f"[Hyde Verdict] Voice generated, encoding to base64...")
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"[Hyde Verdict] Base64 encoded, length: {len(audio_base64)}")
        
        return {
            "script": script,
            "audio_base64": audio_base64,
            "audio_format": "mp3",
            "is_roast": is_bland
        }
    
    except Exception as e:
        print(f"[Hyde Verdict] Error generating Hyde verdict: {e}")
        import traceback
        traceback.print_exc()
        # Return a fallback response
        fallback_script = "Your profile needs some work. Add more details about your skills and interests!"
        return {
            "script": fallback_script,
            "audio_base64": "",
            "audio_format": "mp3",
            "is_roast": True,
            "error": str(e)
        }


async def generate_profile_summary(profile_data: Dict[str, Any]) -> str:
    """
    Generate an AI summary/understanding of a user profile for matching purposes.
    This summary captures the essence of the user's skills, interests, and preferences.
    
    Args:
        profile_data: Dictionary containing profile information
    
    Returns:
        A concise AI-generated summary of the profile
    """
    try:
        # Build profile text
        profile_parts = []
        if profile_data.get('major'):
            profile_parts.append(f"Major: {profile_data['major']}")
        if profile_data.get('experience_level'):
            profile_parts.append(f"Experience: {profile_data['experience_level']}")
        if profile_data.get('skills'):
            profile_parts.append(f"Skills: {', '.join(profile_data['skills'])}")
        if profile_data.get('interests'):
            profile_parts.append(f"Interests: {profile_data['interests']}")
        if profile_data.get('availability_hours_per_week'):
            profile_parts.append(f"Available {profile_data['availability_hours_per_week']} hours/week")
        if profile_data.get('project_size_preference'):
            profile_parts.append(f"Prefers {profile_data['project_size_preference']} projects")
        if profile_data.get('project_duration_preference'):
            profile_parts.append(f"Looking for {profile_data['project_duration_preference']}-term projects")
        if profile_data.get('collaboration_style'):
            profile_parts.append(f"Collaboration style: {profile_data['collaboration_style']}")
        
        profile_text = ". ".join(profile_parts)
        
        if not profile_text:
            return "User seeking collaboration opportunities"
        
        prompt = f"""
Analyze this user profile and create a concise 2-3 sentence summary that captures their technical background, interests, and project preferences. Focus on what types of projects would be a good match.

Profile: {profile_text}

Write a natural, descriptive summary that will help match them with relevant projects. Focus on their strengths and what they're looking for.
"""
        
        model = genai.GenerativeModel('models/gemini-flash-latest')
        response = model.generate_content(prompt)
        
        return response.text.strip()
    
    except Exception as e:
        print(f"Error generating profile summary: {e}")
        return profile_text if profile_text else "User seeking collaboration opportunities"


async def generate_project_summary(project_data: Dict[str, Any]) -> str:
    """
    Generate an AI summary/understanding of a project for matching purposes.
    This summary captures the essence of the project and what kind of collaborators it needs.
    
    Args:
        project_data: Dictionary containing project information
    
    Returns:
        A concise AI-generated summary of the project
    """
    try:
        # Build project text
        project_parts = [
            f"Title: {project_data.get('title', 'Untitled')}",
            f"Description: {project_data.get('description', '')}"
        ]
        
        if project_data.get('tags'):
            project_parts.append(f"Tags: {', '.join(project_data['tags'])}")
        if project_data.get('duration'):
            project_parts.append(f"Duration: {project_data['duration']}")
        if project_data.get('availability_needed'):
            project_parts.append(f"Time commitment: {project_data['availability_needed']}")
        
        # Include roadmap difficulty if available
        if project_data.get('roadmap') and project_data['roadmap'].get('difficulty'):
            project_parts.append(f"Difficulty: {project_data['roadmap']['difficulty']}")
        if project_data.get('roadmap') and project_data['roadmap'].get('recommended_stack'):
            stack = project_data['roadmap']['recommended_stack']
            tech_list = []
            for category, techs in stack.items():
                if techs:
                    tech_list.extend(techs)
            if tech_list:
                project_parts.append(f"Tech stack: {', '.join(tech_list[:5])}")
        
        project_text = ". ".join(project_parts)
        
        prompt = f"""
Analyze this project and create a concise 2-3 sentence summary that captures what the project is about, what skills are needed, and what type of collaborator would be a good fit.

Project: {project_text}

Write a natural, descriptive summary that will help match this project with the right collaborators. Focus on the project's goals and requirements.
"""
        
        model = genai.GenerativeModel('models/gemini-flash-latest')
        response = model.generate_content(prompt)
        
        return response.text.strip()
    
    except Exception as e:
        print(f"Error generating project summary: {e}")
        return project_text if project_text else "Project seeking collaborators"
