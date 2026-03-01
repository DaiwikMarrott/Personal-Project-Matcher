"""Test the RPC matching function"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))

# Test with Nathan's profile
profile_id = '9f3916bc-d56a-4353-b850-8b00c948476d'

print("Testing match_projects_to_profile RPC function...")
print(f"Profile ID: {profile_id}\n")

try:
    result = supabase.rpc(
        'match_projects_to_profile',
        {
            'profile_uuid': profile_id,
            'match_threshold': 0.0,
            'match_limit': 10
        }
    ).execute()
    
    print(f"✓ RPC function returned {len(result.data)} results\n")
    
    if result.data:
        print("Top projects by match score:")
        print("=" * 60)
        for i, project in enumerate(result.data[:10], 1):
            similarity = project.get('similarity', 0)
            title = project.get('title', 'Unknown')
            print(f"{i}. {title}: {round(similarity * 100, 2)}% match")
        print("=" * 60)
    else:
        print("❌ No projects returned")
        
except Exception as e:
    print(f"❌ Error calling RPC function: {e}")
