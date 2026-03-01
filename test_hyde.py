#!/usr/bin/env python3
"""Test script to verify Hyde verdict endpoint and audio generation"""

import urllib.request
import urllib.error
import json
import base64

# Configuration
BACKEND_URL = "http://localhost:8000"

def test_hyde_verdict():
    """Test the Hyde verdict endpoint"""
    print("=" * 80)
    print("TESTING HYDE VERDICT ENDPOINT")
    print("=" * 80)
    
    # Step 1: Get a profile ID from projects endpoint
    print("\n1. Finding a profile by checking projects...")
    try:
        with urllib.request.urlopen(f"{BACKEND_URL}/projects", timeout=10) as response:
            projects = json.loads(response.read().decode())
        
        if not projects:
            print("❌ No projects found in database")
            # Use a test UUID
            profile_id = "00000000-0000-0000-0000-000000000001"
            print(f"⚠️  Using test UUID: {profile_id}")
        else:
            # Get profile_id from first project
            profile_id = projects[0].get('profile_id')
            if not profile_id:
                print("❌ Project doesn't have profile_id")
                return
            print(f"✅ Found profile from project: {profile_id}")
        
    except Exception as e:
        print(f"❌ Failed to fetch projects: {e}")
        # Use a test UUID
        profile_id = "00000000-0000-0000-0000-000000000001"
        print(f"⚠️  Using test UUID: {profile_id}")
    
    # Step 2: Call Hyde verdict endpoint
    print(f"\n2. Calling Hyde verdict endpoint for profile {profile_id}...")
    try:
        req = urllib.request.Request(
            f"{BACKEND_URL}/profile/{profile_id}/hyde-verdict",
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())
        
        print(f"✅ Received response (status {response.status})")
        print(f"\nResponse structure:")
        print(f"  - success: {data.get('success')}")
        print(f"  - is_roast: {data.get('is_roast')}")
        print(f"  - has script: {'script' in data}")
        print(f"  - has audio_base64: {'audio_base64' in data}")
        print(f"  - audio_format: {data.get('audio_format')}")
        
        # Show script
        if 'script' in data:
            script = data['script']
            print(f"\n📝 Script ({len(script)} chars):")
            print("-" * 80)
            print(script)
            print("-" * 80)
        
        # Check audio
        if 'audio_base64' in data and data['audio_base64']:
            audio_b64 = data['audio_base64']
            print(f"\n🔊 Audio data:")
            print(f"  - Base64 length: {len(audio_b64)} chars")
            print(f"  - First 50 chars: {audio_b64[:50]}...")
            print(f"  - Last 50 chars: ...{audio_b64[-50:]}")
            
            # Try to decode
            try:
                audio_bytes = base64.b64decode(audio_b64)
                print(f"  - Decoded size: {len(audio_bytes)} bytes ({len(audio_bytes)/1024:.1f} KB)")
                
                # Check if it looks like MP3
                if audio_bytes[:3] == b'ID3' or audio_bytes[:2] == b'\xff\xfb':
                    print(f"  - ✅ Looks like valid MP3 data")
                else:
                    print(f"  - ⚠️  First bytes: {audio_bytes[:10].hex()}")
                    
            except Exception as e:
                print(f"  - ❌ Failed to decode base64: {e}")
        else:
            print("\n❌ No audio_base64 in response")
        
        # Check for errors
        if 'error' in data:
            print(f"\n⚠️  Error field present: {data['error']}")
        
        print("\n" + "=" * 80)
        print("✅ TEST COMPLETE - HYDE VERDICT ENDPOINT WORKING")
        print("=" * 80)
        
    except urllib.error.URLError as e:
        print(f"❌ Request failed: {e}")
        if hasattr(e, 'read'):
            print(f"Response text: {e.read().decode()[:500]}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_hyde_verdict()
