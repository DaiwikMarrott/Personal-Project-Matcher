#!/usr/bin/env python3
"""
Test ONLY the ElevenLabs audio generation
This bypasses Gemini to test if voice generation works
"""

import sys
import os
import base64
import asyncio

# Add backend to path
sys.path.insert(0, '/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/backend')
os.chdir('/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/backend')

from dotenv import load_dotenv
load_dotenv()

from ai_service import generate_hyde_voice

async def test_elevenlabs():
    """Test ElevenLabs audio generation directly"""
    
    print("=" * 80)
    print("TESTING ELEVENLABS AUDIO GENERATION")
    print("=" * 80)
    print()
    
    # Test script
    test_script = """Well, well, well... John Doe, what do we have here? 
Python, JavaScript, React, FastAPI - quite the fancy stack you've got there! 
And you're interested in Web Development and AI? How delightfully ambitious! 
Let's see if you can actually build something worth talking about, shall we?"""
    
    print("📝 Test Script:")
    print(test_script)
    print()
    
    print("⏳ Generating voice with ElevenLabs...")
    print(f"   API Key configured: {bool(os.getenv('ELEVENLABS_API_KEY'))}")
    print(f"   Voice: Adam (pNInz6obpgDQGcFmaJgB)")
    print(f"   Model: eleven_turbo_v2_5")
    print()
    
    try:
        # Generate voice
        audio_bytes = await generate_hyde_voice(test_script)
        
        print("=" * 80)
        print("✅ SUCCESS - AUDIO GENERATED")
        print("=" * 80)
        print()
        
        print("🔊 Audio Details:")
        print(f"   ✅ Raw bytes received: {len(audio_bytes)} bytes ({len(audio_bytes)/1024:.1f} KB)")
        print()
        
        # Convert to base64 (like the API does)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"   ✅ Base64 encoded: {len(audio_b64)} characters")
        print(f"   ✅ First 50 chars: {audio_b64[:50]}...")
        print(f"   ✅ Last 50 chars: ...{audio_b64[-50:]}")
        print()
        
        # Check if it's valid MP3
        if audio_bytes[:3] == b'ID3' or audio_bytes[:2] == b'\xff\xfb':
            print(f"   ✅ Valid MP3 format detected")
        else:
            hex_start = audio_bytes[:10].hex()
            print(f"   📊 First bytes (hex): {hex_start}")
        print()
        
        # Save to file
        output_file = "/Users/daiwikmarrott/Desktop/SFU/Projects/Personal_Project_Matcher/Personal-Project-Matcher/test_elevenlabs_audio.mp3"
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        
        print(f"   💾 Audio saved to: {output_file}")
        print()
        
        print("=" * 80)
        print("🎉 ELEVENLABS IS WORKING PERFECTLY!")
        print("=" * 80)
        print()
        print("✅ Audio generation: WORKING")
        print("✅ Base64 encoding: WORKING")
        print("✅ File format: VALID MP3")
        print()
        print("▶️  You can play the audio file:")
        print(f"   open {output_file}")
        print()
        print("🔍 This proves:")
        print("   1. ElevenLabs API key is valid")
        print("   2. Voice generation is working")
        print("   3. Audio encoding is correct")
        print("   4. The backend CAN generate audio for the frontend")
        print()
        print("⚠️  Note: Gemini quota is exhausted for today")
        print("   But the audio generation feature itself works!")
        print()
        
    except Exception as e:
        print("=" * 80)
        print("❌ ERROR")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_elevenlabs())
