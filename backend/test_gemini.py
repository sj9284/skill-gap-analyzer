import os
from dotenv import load_dotenv
load_dotenv()

from google import genai

api_key = os.environ.get("GEMINI_API_KEY", "")
print("API Key found:", "Yes" if api_key else "No!")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="models/gemma-3-4b-it",
        contents="Say hello in one word"
    )
    print("Response:", response.text)
    print("✅ Gemini API is working!")
except Exception as e:
    print("❌ Error:", str(e))