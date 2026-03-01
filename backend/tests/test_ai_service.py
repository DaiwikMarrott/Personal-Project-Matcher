"""
Tests for AI service functions
"""
import pytest
from ai_service import generate_embedding, generate_hype_audio_script

@pytest.mark.asyncio
async def test_generate_embedding_with_text():
    """Test embedding generation with valid text"""
    text = "Python FastAPI backend developer"
    embedding = await generate_embedding(text)
    
    assert isinstance(embedding, list)
    assert len(embedding) == 768
    assert all(isinstance(x, float) for x in embedding)

@pytest.mark.asyncio
async def test_generate_embedding_empty_text():
    """Test embedding generation with empty text"""
    embedding = await generate_embedding("")
    
    assert isinstance(embedding, list)
    assert len(embedding) == 768
    assert all(x == 0.0 for x in embedding)

@pytest.mark.asyncio
async def test_generate_hype_script_roast():
    """Test roast script generation"""
    profile_text = "I like coding"
    script = await generate_hype_audio_script(profile_text, mode="roast")
    
    assert isinstance(script, str)
    assert len(script) > 0

@pytest.mark.asyncio
async def test_generate_hype_script_hype():
    """Test hype script generation"""
    project_text = "Amazing AI project to change the world"
    script = await generate_hype_audio_script(project_text, mode="hype")
    
    assert isinstance(script, str)
    assert len(script) > 0

# Note: These tests require API keys to be set
# Run with: pytest -v
