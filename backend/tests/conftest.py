"""
Test configuration and fixtures for Project Jekyll & Hyde backend
"""
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)

@pytest.fixture
def sample_profile():
    """Sample profile data for testing"""
    return {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "major": "Computer Science",
        "skills": ["Python", "JavaScript"],
        "experience_level": "intermediate"
    }

@pytest.fixture
def sample_project():
    """Sample project data for testing"""
    return {
        "owner_id": "00000000-0000-0000-0000-000000000000",  # Placeholder UUID
        "title": "Test Project",
        "description": "A test project for unit testing",
        "tags": ["test", "python"]
    }
