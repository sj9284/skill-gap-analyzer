from flask import Blueprint, request, jsonify
from app.services.bert_matcher import calculate_bert_match
from app.services.tfidf_matcher import calculate_tfidf_match
from app.services.job_loader import get_skills_for_role
from app.services.skill_matcher import (
    calculate_match,
    get_recommendations,
    get_best_roles,
    compare_roles
)
from app.services.insights import (
    get_top_skills_demand,
    get_top_roles_demand,
    get_job_type_breakdown,
    get_location_demand,
    get_salary_insights,
    get_skills_by_role_type,
    get_full_market_overview
)

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/match", methods=["POST"])
def match():
    """
    Match user skills against a specific role.
    Uses Level 3 Semantic as primary method.
    Body: { "skills": ["Python", "React"], "role": "Full Stack Development" }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "Send JSON body"}), 400
    if "skills" not in data or not data["skills"]:
        return jsonify({"error": "Provide 'skills' list"}), 400
    if "role" not in data or not data["role"]:
        return jsonify({"error": "Provide 'role' string"}), 400

    user_skills = data["skills"]
    role = data["role"]

    match_result = calculate_match(user_skills, role)

    if "error" in match_result:
        return jsonify(match_result), 404

    recommendations = get_recommendations(
        match_result["missing_skills"], role
    )

    return jsonify({
        **match_result,
        "recommendations": recommendations
    })


@analysis_bp.route("/best-roles", methods=["POST"])
def best_roles():
    """
    Find the best matching roles for a user's skills.
    Body: { "skills": ["Python", "React"], "top_n": 10 }
    """
    data = request.get_json()

    if not data or "skills" not in data:
        return jsonify({"error": "Provide 'skills' list"}), 400

    user_skills = data["skills"]
    top_n = data.get("top_n", 10)

    results = get_best_roles(user_skills, top_n)
    return jsonify({
        "user_skill_count": len(user_skills),
        "top_roles": results
    })


@analysis_bp.route("/compare-roles", methods=["POST"])
def compare():
    """
    Compare user skills against specific list of roles.
    Body: { "skills": ["Python"], "roles": ["Data Science", "ML Engineer"] }
    """
    data = request.get_json()

    if not data or "skills" not in data or "roles" not in data:
        return jsonify({"error": "Provide 'skills' and 'roles'"}), 400

    results = compare_roles(data["skills"], data["roles"])
    return jsonify({"comparison": results})


# ─────────────────────────────────────────
# Market Insights Endpoints
# ─────────────────────────────────────────

@analysis_bp.route("/insights", methods=["GET"])
def full_insights():
    """All market insights in one call — used by frontend dashboard."""
    return jsonify(get_full_market_overview())


@analysis_bp.route("/insights/skills", methods=["GET"])
def top_skills():
    n = request.args.get("n", 20, type=int)
    return jsonify(get_top_skills_demand(n))


@analysis_bp.route("/insights/roles", methods=["GET"])
def top_roles():
    n = request.args.get("n", 20, type=int)
    return jsonify(get_top_roles_demand(n))


@analysis_bp.route("/insights/locations", methods=["GET"])
def locations():
    n = request.args.get("n", 10, type=int)
    return jsonify(get_location_demand(n))


@analysis_bp.route("/insights/job-types", methods=["GET"])
def job_types():
    return jsonify(get_job_type_breakdown())


@analysis_bp.route("/insights/salary", methods=["GET"])
def salary():
    return jsonify(get_salary_insights())


@analysis_bp.route("/insights/skills-by-type", methods=["GET"])
def skills_by_type():
    return jsonify(get_skills_by_role_type())


@analysis_bp.route("/match/bert", methods=["POST"])
def match_bert():
    """
    BERT semantic matching endpoint.
    Body: { "skills": [...], "role": "..." }
    """
    data = request.get_json()
    if not data or "skills" not in data or "role" not in data:
        return jsonify({"error": "Provide skills and role"}), 400

    user_skills = data["skills"]
    role = data["role"]
    threshold = data.get("threshold", 0.75)

    role_skills = get_skills_for_role(role)[:25]
    if not role_skills:
        return jsonify({"error": f"No skills found for role: {role}"}), 404

    result = calculate_bert_match(user_skills, role_skills, threshold)
    recommendations = get_recommendations(result["missing_skills"], role)

    return jsonify({
        **result,
        "role": role,
        "matched_skills": (
            [m["skill"] for m in result["exact_matched"]] +
            [f"{m['skill']} (~{m['matched_with']})"
             for m in result["semantic_matched"]]
        ),
        "recommendations": recommendations
    })


@analysis_bp.route("/compare-methods", methods=["POST"])
def compare_methods():
    """
    Compare all 3 matching methods side by side independently.
    Each method runs on its own — fair comparison for research paper.
    Body: { "skills": [...], "role": "..." }
    """
    data = request.get_json()
    if not data or "skills" not in data or "role" not in data:
        return jsonify({"error": "Provide skills and role"}), 400

    user_skills = data["skills"]
    role = data["role"]

    role_skills = get_skills_for_role(role)[:25]
    if not role_skills:
        return jsonify({"error": f"No skills found for role: {role}"}), 404

    import time
    from app.utils.skill_taxonomy import normalize_skill

    # ─────────────────────────────────────────
    # Method 1 — Pure Keyword + Synonym (Level 1)
    # Runs independently — no BERT or TF-IDF
    # ─────────────────────────────────────────
    t1 = time.time()

    user_norms = {normalize_skill(s) for s in user_skills}
    role_norms = [normalize_skill(s) for s in role_skills]

    keyword_matched = []
    keyword_missing = []

    for skill, norm in zip(role_skills, role_norms):
        if norm in user_norms:
            keyword_matched.append(skill)
        else:
            keyword_missing.append(skill)

    keyword_total = len(role_skills)
    keyword_score = round(
        len(keyword_matched) / keyword_total * 100, 1
    ) if keyword_total > 0 else 0.0

    if keyword_score >= 75:
        keyword_level = "Strong Match"
    elif keyword_score >= 50:
        keyword_level = "Good Match"
    elif keyword_score >= 25:
        keyword_level = "Partial Match"
    else:
        keyword_level = "Low Match"

    keyword_time = round(time.time() - t1, 4)

    # ─────────────────────────────────────────
    # Method 2 — TF-IDF Cosine Similarity (Level 2)
    # Runs independently
    # ─────────────────────────────────────────
    t2 = time.time()
    tfidf_result = calculate_tfidf_match(user_skills, role_skills)
    tfidf_time = round(time.time() - t2, 4)

    # ─────────────────────────────────────────
    # Method 3 — Semantic Taxonomy (Level 3)
    # Runs independently with threshold 0.75
    # ─────────────────────────────────────────
    t3 = time.time()
    bert_result = calculate_bert_match(user_skills, role_skills, threshold=0.75)
    bert_time = round(time.time() - t3, 4)

    return jsonify({
        "role": role,
        "user_skill_count": len(user_skills),
        "role_skill_count": len(role_skills),
        "results": {
            "keyword_matching": {
                "method": "Keyword + Synonym Matching (Level 1)",
                "match_score": keyword_score,
                "match_level": keyword_level,
                "matched_count": len(keyword_matched),
                "missing_count": len(keyword_missing),
                "processing_time_seconds": keyword_time
            },
            "tfidf_similarity": {
                "method": "TF-IDF Cosine Similarity (Level 2)",
                "match_score": tfidf_result["match_score"],
                "match_level": tfidf_result["match_level"],
                "exact_count": tfidf_result["exact_count"],
                "similar_count": tfidf_result["similar_count"],
                "missing_count": tfidf_result["missing_count"],
                "processing_time_seconds": tfidf_time
            },
            "bert_semantic": {
                "method": "Semantic Taxonomy Matching (Level 3)",
                "match_score": bert_result["match_score"],
                "match_level": bert_result["match_level"],
                "exact_count": bert_result["exact_count"],
                "semantic_count": bert_result["semantic_count"],
                "missing_count": bert_result["missing_count"],
                "processing_time_seconds": bert_time
            }
        },
        "paper_summary": {
            "best_accuracy": "Semantic Taxonomy Matching",
            "fastest": "Keyword + Synonym Matching",
            "recommended": "Combined pipeline for production"
        }
    })