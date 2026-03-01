"""
Script to update existing profiles and projects with AI summaries and embeddings.
Run this after fixing the backend to regenerate AI summaries for existing data.
"""
import asyncio
import time
from supabase import create_client
from ai_service import generate_profile_summary, generate_project_summary, generate_embedding
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")  # Use ANON_KEY from .env
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Rate limiting (Free tier: 5 requests per minute)
REQUEST_DELAY = 13  # seconds between requests (60/5 = 12, using 13 to be safe)


async def update_profiles():
    """Update all existing profiles with AI summaries and embeddings."""
    print("Fetching all profiles...")
    response = supabase.table("profiles").select("*").execute()
    profiles = response.data
    
    print(f"Found {len(profiles)} profiles to update")
    
    for idx, profile in enumerate(profiles, 1):
        try:
            print(f"\n[{idx}/{len(profiles)}] Updating profile: {profile['first_name']} {profile['last_name']}")
            
            # Generate AI summary
            print("  - Generating AI summary...")
            ai_summary = await generate_profile_summary(profile)
            print(f"  - Summary: {ai_summary[:80]}...")
            
            # Generate embedding from AI summary
            print("  - Generating embedding from summary...")
            bio_embedding = await generate_embedding(ai_summary)
            print(f"  - Embedding generated: {len(bio_embedding)} dimensions")
            
            # Update the profile
            print("  - Updating database...")
            supabase.table("profiles").update({
                "profile_ai_summary": ai_summary,
                "bio_embedding": bio_embedding
            }).eq("id", profile['id']).execute()
            
            print(f"  ✅ Profile updated successfully")
            
            # Rate limiting - wait before next request
            if idx < len(profiles):
                print(f"  ⏳ Waiting {REQUEST_DELAY}s to avoid rate limit...")
                time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"  ❌ Error updating profile {profile['id']}: {e}")


async def update_projects():
    """Update all existing projects with AI summaries and embeddings."""
    print("\n\nFetching all projects...")
    response = supabase.table("projects").select("*").execute()
    projects = response.data
    
    print(f"Found {len(projects)} projects to update")
    
    for idx, project in enumerate(projects, 1):
        try:
            print(f"\n[{idx}/{len(projects)}] Updating project: {project['title']}")
            
            # Generate AI summary
            print("  - Generating AI summary...")
            ai_summary = await generate_project_summary(project)
            print(f"  - Summary: {ai_summary[:80]}...")
            
            # Generate embedding from AI summary
            print("  - Generating embedding from summary...")
            project_embedding = await generate_embedding(ai_summary)
            print(f"  - Embedding generated: {len(project_embedding)} dimensions")
            
            # Update the project
            print("  - Updating database...")
            supabase.table("projects").update({
                "project_ai_summary": ai_summary,
                "project_embedding": project_embedding
            }).eq("id", project['id']).execute()
            
            print(f"  ✅ Project updated successfully")
            
            # Rate limiting - wait before next request
            if idx < len(projects):
                print(f"  ⏳ Waiting {REQUEST_DELAY}s to avoid rate limit...")
                time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"  ❌ Error updating project {project['id']}: {e}")


async def main():
    """Main function to update all data."""
    print("=" * 70)
    print("AI SUMMARY & EMBEDDING UPDATE SCRIPT")
    print("=" * 70)
    print("\nThis script will:")
    print("1. Generate AI summaries for all existing profiles")
    print("2. Generate embeddings from those summaries")
    print("3. Update all profiles in the database")
    print("4. Do the same for all projects")
    print("\n" + "=" * 70 + "\n")
    
    # Update profiles
    await update_profiles()
    
    # Update projects
    await update_projects()
    
    print("\n" + "=" * 70)
    print("✅ UPDATE COMPLETE!")
    print("=" * 70)
    print("\nAll profiles and projects now have:")
    print("- AI-generated summaries describing their essence")
    print("- Embeddings based on those summaries for matching")
    print("\nYou can now use the 'Sort by Match' feature!")


if __name__ == "__main__":
    asyncio.run(main())
