from flask import Blueprint, request, jsonify
from app.services.job_loader import (
    get_all_roles,
    get_roles_by_type,
    get_skills_for_role,
    get_jobs_for_role,
    get_top_skills,
    get_dataset_stats
)

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/roles", methods=["GET"])
def roles():
    job_type = request.args.get("type")
    if job_type:
        return jsonify(get_roles_by_type(job_type))
    return jsonify(get_all_roles())

@jobs_bp.route("/skills/<path:role>", methods=["GET"])
def skills_for_role(role):
    return jsonify({"role": role, "skills": get_skills_for_role(role)})

@jobs_bp.route("/listings/<path:role>", methods=["GET"])
def listings_for_role(role):
    return jsonify(get_jobs_for_role(role))

@jobs_bp.route("/top-skills", methods=["GET"])
def top_skills():
    n = request.args.get("n", 20, type=int)
    return jsonify(get_top_skills(n))

@jobs_bp.route("/stats", methods=["GET"])
def stats():
    return jsonify(get_dataset_stats())