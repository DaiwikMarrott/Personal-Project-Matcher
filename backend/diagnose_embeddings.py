"""
Diagnostic script to check the state of embeddings in the database.
This will help identify why match scores are showing as 0%.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_embeddings():
    """Check if profiles and projects have valid embeddings."""
    
    print("=" * 80)
    print("EMBEDDING DIAGNOSTIC REPORT")
    print("=" * 80)
    
    # Check profiles
    print("\n📊 PROFILES CHECK")
    print("-" * 80)
    profiles_response = supabase.table("profiles").select("id, first_name, last_name, bio_embedding, profile_ai_summary").execute()
    profiles = profiles_response.data
    
    print(f"Total profiles: {len(profiles)}")
    
    null_bio_embeddings = 0
    null_summaries = 0
    zero_embeddings = 0
    
    for profile in profiles:
        has_embedding = profile.get('bio_embedding') is not None
        has_summary = profile.get('profile_ai_summary') is not None
        
        if not has_embedding:
            null_bio_embeddings += 1
            print(f"  ❌ {profile['first_name']} {profile['last_name']}: Missing bio_embedding")
        elif has_embedding:
            # Check if it's a zero vector (all values are 0)
            embedding = profile['bio_embedding']
            if isinstance(embedding, list) and all(v == 0 for v in embedding):
                zero_embeddings += 1
                print(f"  ⚠️  {profile['first_name']} {profile['last_name']}: Zero vector embedding")
        
        if not has_summary:
            null_summaries += 1
            print(f"  ❌ {profile['first_name']} {profile['last_name']}: Missing profile_ai_summary")
    
    print(f"\nSummary:")
    print(f"  - Profiles with NULL embeddings: {null_bio_embeddings}/{len(profiles)}")
    print(f"  - Profiles with zero vector embeddings: {zero_embeddings}/{len(profiles)}")
    print(f"  - Profiles with NULL AI summaries: {null_summaries}/{len(profiles)}")
    
    # Check projects
    print("\n📊 PROJECTS CHECK")
    print("-" * 80)
    projects_response = supabase.table("projects").select("id, title, project_embedding, project_ai_summary, status").execute()
    projects = projects_response.data
    
    print(f"Total projects: {len(projects)}")
    open_projects = [p for p in projects if p.get('status') == 'open']
    print(f"Open projects: {len(open_projects)}")
    
    null_project_embeddings = 0
    null_project_summaries = 0
    zero_project_embeddings = 0
    
    for project in projects:
        has_embedding = project.get('project_embedding') is not None
        has_summary = project.get('project_ai_summary') is not None
        
        if not has_embedding:
            null_project_embeddings += 1
            print(f"  ❌ {project['title']}: Missing project_embedding")
        elif has_embedding:
            # Check if it's a zero vector
            embedding = project['project_embedding']
            if isinstance(embedding, list) and all(v == 0 for v in embedding):
                zero_project_embeddings += 1
                print(f"  ⚠️  {project['title']}: Zero vector embedding")
        
        if not has_summary:
            null_project_summaries += 1
            print(f"  ❌ {project['title']}: Missing project_ai_summary")
    
    print(f"\nSummary:")
    print(f"  - Projects with NULL embeddings: {null_project_embeddings}/{len(projects)}")
    print(f"  - Projects with zero vector embeddings: {zero_project_embeddings}/{len(projects)}")
    print(f"  - Projects with NULL AI summaries: {null_project_summaries}/{len(projects)}")
    
    # Check RPC function
    print("\n📊 RPC FUNCTION TEST")
    print("-" * 80)
    if profiles:
        test_profile_id = profiles[0]['id']
        print(f"Testing match_projects_to_profile with profile: {profiles[0]['first_name']} {profiles[0]['last_name']}")
        
        try:
            rpc_response = supabase.rpc(
                "match_projects_to_profile",
                {
                    "profile_uuid": test_profile_id,
                    "match_threshold": 0.0,
                    "match_limit": 10
                }
            ).execute()
            
            matched_projects = rpc_response.data or []
            print(f"  ✅ RPC function returned {len(matched_projects)} projects")
            
            if matched_projects:
                print(f"\n  Top 3 matches:")
                for i, proj in enumerate(matched_projects[:3], 1):
                    similarity = proj.get('similarity', 0)
                    print(f"    {i}. {proj['title']}: {similarity:.4f} ({int(similarity * 100)}% match)")
            else:
                print("  ⚠️  No projects returned by RPC function")
                
        except Exception as e:
            print(f"  ❌ RPC function error: {e}")
    
    # Final diagnosis
    print("\n" + "=" * 80)
    print("DIAGNOSIS")
    print("=" * 80)
    
    total_null_embeddings = null_bio_embeddings + null_project_embeddings
    total_zero_embeddings = zero_embeddings + zero_project_embeddings
    
    if total_null_embeddings > 0 or total_zero_embeddings > 0:
        print("❌ ISSUE FOUND: Invalid embeddings detected!")
        print("\nRECOMMENDED ACTION:")
        print("  Run the following command to regenerate embeddings:")
        print("  $ python3 update_existing_data.py")
        print("\nThis will:")
        print("  1. Generate AI summaries for all profiles and projects")
        print("  2. Create proper embeddings from those summaries")
        print("  3. Update the database with valid embedding vectors")
    else:
        print("✅ All embeddings appear valid!")
        print("\nIf match scores are still 0%, check:")
        print("  1. Backend logs for RPC errors")
        print("  2. Frontend console for API errors")
        print("  3. Supabase dashboard for RPC function definition")
    
    print("=" * 80)

if __name__ == "__main__":
    check_embeddings()
