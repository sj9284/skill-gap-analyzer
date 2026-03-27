from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS so your React frontend can talk to this
    CORS(app, origins=Config.CORS_ORIGINS)

    # Register blueprints (routes)
    from app.routes.resume import resume_bp
    from app.routes.jobs import jobs_bp
    from app.routes.analysis import analysis_bp
    from app.routes.chat import chat_bp  # ✅ New chat blueprint

    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")  # ✅ New

    # Health check route
    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "Skill Gap Analyzer API is running"}

    return app