#!/usr/bin/env python3
"""Get a profile ID and test Hyde verdict"""

import os
import sys

# Add backend to path
sys.path.insert(0, '/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/backend')

from supabase import create_client

# Load environment
from dotenv import load_dotenv
load_dotenv('/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

print("=" * 80)
print("GETTING PROFILE ID")
print("=" * 80)
print(f"Supabase URL: {SUPABASE_URL}")
print(f"Has Key: {bool(SUPABASE_KEY)}")
print()

# Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get profiles
try:
    response = supabase.table("profiles").select("id, first_name, last_name, skills").limit(5).execute()
    
    if response.data:
        print(f"✅ Found {len(response.data)} profiles:")
        print()
        for i, profile in enumerate(response.data, 1):
            print(f"{i}. ID: {profile['id']}")
            print(f"   Name: {profile.get('first_name', 'N/A')} {profile.get('last_name', 'N/A')}")
            print(f"   Skills: {profile.get('skills', [])}")
            print()
        
        # Return first profile ID for testing
        test_id = response.data[0]['id']
        print("=" * 80)
        print(f"TEST PROFILE ID: {test_id}")
        print("=" * 80)
        print()
        print(f"You can test with: curl -X POST http://localhost:8000/profile/{test_id}/hyde-verdict")
        
    else:
        print("❌ No profiles found in database")
        print("   Create a profile first by signing up at http://localhost:8081")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
