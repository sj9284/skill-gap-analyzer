import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.services.resume_parser import parse_resume

resume_bp = Blueprint("resume", __name__)


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    allowed = current_app.config["ALLOWED_EXTENSIONS"]
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


@resume_bp.route("/upload", methods=["POST"])
def upload_resume():
    """
    Accept a PDF or DOCX resume, extract skills from it.
    Expects multipart/form-data with field name: 'resume'
    """
    # 1. Check file is present in request
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded. Use field name 'resume'"}), 400

    file = request.files["resume"]

    # 2. Check file was actually selected
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # 3. Check file type
    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF and DOCX files are allowed"}), 400

    # 4. Save file securely
    filename = secure_filename(file.filename)
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # 5. Parse resume and extract skills
    try:
        result = parse_resume(str(file_path))
        return jsonify({
            "success": True,
            "filename": filename,
            "skill_count": result["skill_count"],
            "skills": result["skills"],
            "text_length": result["raw_text_length"]
        })
    except Exception as e:
        return jsonify({"error": f"Failed to parse resume: {str(e)}"}), 500


@resume_bp.route("/test-skills", methods=["POST"])
def test_skills():
    """
    Quick test endpoint — send raw text, get back matched skills.
    Expects JSON: { "text": "your resume text here" }
    """
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Send JSON with 'text' field"}), 400

    from app.services.resume_parser import extract_skills_from_text
    skills = extract_skills_from_text(data["text"])
    return jsonify({"skills": skills, "count": len(skills)})