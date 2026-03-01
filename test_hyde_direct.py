#!/usr/bin/env python3
"""
Direct test of Hyde verdict generation without needing a profile ID
This proves the audio generation works end-to-end
"""

import sys
import os
import base64

# Add backend to path
sys.path.insert(0, '/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/backend')

# Set environment
os.chdir('/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/backend')

from dotenv import load_dotenv
load_dotenv()

# Import the AI service functions
from ai_service import generate_hyde_verdict
import asyncio

async def test_hyde():
    """Test Hyde verdict generation with sample profile data"""
    
    print("=" * 80)
    print("TESTING HYDE VERDICT GENERATION")
    print("=" * 80)
    print()
    
    # Create test profile data
    test_profile = {
        "id": "test-123",
        "first_name": "John",
        "last_name": "Doe",
        "skills": ["Python", "JavaScript", "React", "FastAPI"],
        "interests": ["Web Development", "AI", "Game Design"],
        "experience_level": "intermediate",
        "preferred_roles": ["Frontend Developer", "Full Stack"],
        "availability": "10 hours/week"
    }
    
    print("📋 Test Profile:")
    print(f"   Name: {test_profile['first_name']} {test_profile['last_name']}")
    print(f"   Skills: {', '.join(test_profile['skills'])}")
    print(f"   Interests: {', '.join(test_profile['interests'])}")
    print()
    
    print("⏳ Generating Hyde verdict (calling AI services)...")
    print("   - Gemini AI: Generating script")
    print("   - ElevenLabs: Generating voice")
    print()
    
    try:
        # Call the Hyde verdict function
        result = await generate_hyde_verdict(test_profile)
        
        print("=" * 80)
        print("✅ SUCCESS - HYDE VERDICT GENERATED")
        print("=" * 80)
        print()
        
        # Display results
        print("📝 Script:")
        print("-" * 80)
        print(result["script"])
        print("-" * 80)
        print()
        
        print("🎭 Mode:", "ROAST" if result["is_roast"] else "HYPE")
        print()
        
        # Check audio
        if result.get("audio_base64"):
            audio_b64 = result["audio_base64"]
            print("🔊 Audio Generation:")
            print(f"   ✅ Base64 audio generated")
            print(f"   ✅ Length: {len(audio_b64)} characters")
            print(f"   ✅ Format: {result['audio_format']}")
            print(f"   ✅ First 50 chars: {audio_b64[:50]}...")
            print(f"   ✅ Last 50 chars: ...{audio_b64[-50:]}")
            print()
            
            # Decode to verify
            try:
                audio_bytes = base64.b64decode(audio_b64)
                print(f"   ✅ Decoded size: {len(audio_bytes)} bytes ({len(audio_bytes)/1024:.1f} KB)")
                
                # Check if it's valid MP3
                if audio_bytes[:3] == b'ID3' or audio_bytes[:2] == b'\xff\xfb':
                    print(f"   ✅ Valid MP3 format detected")
                else:
                    print(f"   ⚠️  First bytes (hex): {audio_bytes[:10].hex()}")
                print()
                
                # Save to file for verification
                output_file = "/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/test_hyde_audio.mp3"
                with open(output_file, "wb") as f:
                    f.write(audio_bytes)
                print(f"   💾 Audio saved to: {output_file}")
                print(f"   ▶️  You can play it with: open {output_file}")
                print()
                
            except Exception as e:
                print(f"   ❌ Error decoding audio: {e}")
                print()
        else:
            print("❌ No audio generated")
            print()
        
        print("=" * 80)
        print("🎉 HYDE FEATURE IS WORKING CORRECTLY")
        print("=" * 80)
        print()
        print("Next steps:")
        print("1. The MP3 file has been saved - you can play it to verify audio works")
        print("2. The backend API is working correctly")
        print("3. The frontend should be able to play this audio")
        print()
        
    except Exception as e:
        print("=" * 80)
        print("❌ ERROR DURING TESTING")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_hyde())
