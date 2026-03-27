from app.services.job_loader import get_skills_for_role, _load_data
from app.utils.skill_taxonomy import normalize_skill
from app.services.tfidf_matcher import calculate_tfidf_match
from app.services.bert_matcher import calculate_bert_match


def calculate_match(user_skills: list[str], role: str) -> dict:
    """
    Main matching function using Level 3 Semantic as primary method.
    This gives the most accurate match score.
    """
    role_skills = get_skills_for_role(role)[:25]

    if not role_skills:
        return {
            "error": f"No skills found for role: {role}",
            "role": role
        }

    # ✅ Use Level 3 Semantic as primary method
    result = calculate_bert_match(user_skills, role_skills)

    # Build matched skills list (exact + semantic)
    matched_skills = (
        [m["skill"] for m in result["exact_matched"]] +
        [f"{m['skill']} (~{m['matched_with']})"
         for m in result["semantic_matched"]]
    )

    return {
        "role": role,
        "match_score": result["match_score"],
        "match_level": result["match_level"],
        "total_role_skills": result["total_role_skills"],
        "matched_count": result["exact_count"] + result["semantic_count"],
        "exact_count": result["exact_count"],
        "similar_count": result["semantic_count"],
        "missing_count": result["missing_count"],
        "matched_skills": matched_skills,
        "missing_skills": result["missing_skills"],
        "match_detail": {
            "exact_matches": result["exact_matched"],
            "similar_matches": result["semantic_matched"],
        }
    }


def get_recommendations(missing_skills: list[str], role: str) -> list[dict]:
    """
    Generate learning recommendations for missing skills.
    Prioritizes skills that appear most frequently in the dataset.
    """
    df = _load_data()

    from collections import Counter
    all_skills_flat = []
    for skill_list in df["skills_list"]:
        all_skills_flat.extend([normalize_skill(s) for s in skill_list])

    skill_freq = Counter(all_skills_flat)

    recommendations = []
    for skill in missing_skills:
        skill_norm = normalize_skill(skill)
        freq = skill_freq.get(skill_norm, 0)
        recommendations.append({
            "skill": skill,
            "demand_count": freq,
            "priority": _get_priority(freq)
        })

    recommendations.sort(key=lambda x: x["demand_count"], reverse=True)
    return recommendations


def _get_priority(freq: int) -> str:
    if freq >= 100:
        return "High Priority"
    elif freq >= 50:
        return "Medium Priority"
    else:
        return "Low Priority"


def compare_roles(user_skills: list[str], roles: list[str]) -> list[dict]:
    """Compare user skills against multiple roles."""
    results = []
    for role in roles:
        match = calculate_match(user_skills, role)
        if "error" not in match and match["total_role_skills"] >= 5:
            results.append({
                "role": role,
                "match_score": match["match_score"],
                "match_level": match["match_level"],
                "matched_count": match["matched_count"],
                "missing_count": match["missing_count"],
                "total_role_skills": match["total_role_skills"],
            })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results


def get_best_roles(user_skills: list[str], top_n: int = 10) -> list[dict]:
    """Find top N roles matching user skills."""
    df = _load_data()
    all_roles = df["role"].unique().tolist()
    results = compare_roles(user_skills, all_roles)
    return results[:top_n]