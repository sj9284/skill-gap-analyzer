import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    DATA_FOLDER = BASE_DIR / "data"
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    ALLOWED_EXTENSIONS = {"pdf", "docx"}
    CORS_ORIGINS = "*"
    # ✅ Anthropic API Key
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "") 