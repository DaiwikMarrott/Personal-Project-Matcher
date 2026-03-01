"""Quick test to list available Gemini models"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

print("=" * 70)
print("AVAILABLE GEMINI MODELS")
print("=" * 70 + "\n")

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"✓ {model.name} - (Text Generation)")
    if 'embedContent' in model.supported_generation_methods:
        print(f"✓ {model.name} - (Embeddings)")
