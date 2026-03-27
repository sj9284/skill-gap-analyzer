from flask import Blueprint, request, jsonify
from app.services.chat_service import process_message

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/message", methods=["POST"])
def chat():
    """
    Main chat endpoint.
    Body: {
        "message": "What skills am I missing?",
        "skills": ["Python", "React"],
        "history": [{"role": "user", "content": "..."}]
    }
    """
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"error": "Provide a message"}), 400

    message = data["message"].strip()
    user_skills = data.get("skills", [])
    history = data.get("history", [])

    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    result = process_message(message, user_skills, history)

    return jsonify({
        "response": result["response"],
        "intent": result["intent"],
        "method": result["method"]
    })


@chat_bp.route("/suggestions", methods=["GET"])
def suggestions():
    """Return suggested questions for the chat."""
    return jsonify({
        "suggestions": [
            "What skills am I missing for Full Stack Development?",
            "What are my best matching roles?",
            "What are the top skills in demand?",
            "What skills are needed for Data Science?",
            "What is the salary range for Python Development?",
            "Should I learn React or Angular?",
            "Give me a learning roadmap for ML Engineer",
        ]
    })