import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.job_loader import _load_data
from app.utils.skill_taxonomy import normalize_skill

# Cache
_vectorizer = None
_skill_matrix = None
_skill_list = None


def _build_tfidf_index():
    """
    Build TF-IDF index from all unique skills in the dataset.
    Called once and cached.
    """
    global _vectorizer, _skill_matrix, _skill_list

    if _vectorizer is not None:
        return

    df = _load_data()

    # Collect all unique skills
    all_skills = set()
    for skill_list in df["skills_list"]:
        for skill in skill_list:
            all_skills.add(normalize_skill(skill))

    _skill_list = list(all_skills)

    # Build TF-IDF matrix
    # Each skill is treated as a "document"
    # Character n-grams capture partial matches
    _vectorizer = TfidfVectorizer(
        analyzer="char_wb",   # character-level n-grams
        ngram_range=(2, 4),   # bigrams to 4-grams
        min_df=1,
        lowercase=True
    )

    _skill_matrix = _vectorizer.fit_transform(_skill_list)
    print(f"[TF-IDF] Index built: {len(_skill_list)} unique skills")


def get_tfidf_similarity(skill_a: str, skill_b: str) -> float:
    """
    Get TF-IDF cosine similarity between two skill strings.
    Returns float between 0.0 and 1.0
    """
    _build_tfidf_index()

    vec = _vectorizer.transform([
        normalize_skill(skill_a),
        normalize_skill(skill_b)
    ])
    score = cosine_similarity(vec[0], vec[1])[0][0]
    return float(score)


def find_best_tfidf_match(user_skill: str, role_skills: list[str], threshold: float = 0.5) -> tuple[str, float]:
    """
    Find the best matching role skill for a user skill using TF-IDF.
    Returns (best_match_skill, similarity_score)
    Returns ("", 0.0) if no match above threshold.
    """
    _build_tfidf_index()

    user_norm = normalize_skill(user_skill)
    role_norms = [normalize_skill(s) for s in role_skills]

    # Vectorize user skill + all role skills
    all_texts = [user_norm] + role_norms
    vectors = _vectorizer.transform(all_texts)

    # Compare user skill vector against all role skill vectors
    user_vec = vectors[0]
    role_vecs = vectors[1:]

    similarities = cosine_similarity(user_vec, role_vecs)[0]

    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])

    if best_score >= threshold:
        return role_skills[best_idx], best_score
    return "", 0.0


def calculate_tfidf_match(user_skills: list[str], role_skills: list[str], threshold: float = 0.5) -> dict:
    """
    Calculate match between user skills and role skills using TF-IDF.
    Returns detailed match results with similarity scores.
    """
    _build_tfidf_index()

    matched = []
    partial = []
    missing = []
    used_role_skills = set()

    for role_skill in role_skills:
        role_norm = normalize_skill(role_skill)

        # First try exact match
        exact_found = False
        for user_skill in user_skills:
            if normalize_skill(user_skill) == role_norm:
                matched.append({
                    "skill": role_skill,
                    "match_type": "exact",
                    "similarity": 1.0
                })
                used_role_skills.add(role_skill)
                exact_found = True
                break

        if exact_found:
            continue

        # Try TF-IDF similarity match
        best_user_skill = ""
        best_score = 0.0

        for user_skill in user_skills:
            score = get_tfidf_similarity(user_skill, role_skill)
            if score > best_score:
                best_score = score
                best_user_skill = user_skill

        if best_score >= threshold:
            partial.append({
                "skill": role_skill,
                "matched_with": best_user_skill,
                "match_type": "similar",
                "similarity": round(best_score, 3)
            })
            used_role_skills.add(role_skill)
        else:
            missing.append({
                "skill": role_skill,
                "similarity": round(best_score, 3)
            })

    # Calculate weighted score
    # Exact match = 1.0 point, Partial match = similarity score points
    total = len(role_skills)
    if total == 0:
        score = 0.0
    else:
        exact_points = len(matched) * 1.0
        partial_points = sum(p["similarity"] for p in partial)
        score = round(((exact_points + partial_points) / total) * 100, 1)

    # Determine match level
    if score >= 75:
        level = "Strong Match"
    elif score >= 50:
        level = "Good Match"
    elif score >= 25:
        level = "Partial Match"
    else:
        level = "Low Match"

    return {
        "match_score": score,
        "match_level": level,
        "total_role_skills": total,
        "exact_matched": matched,
        "similar_matched": partial,
        "missing_skills": [m["skill"] for m in missing],
        "exact_count": len(matched),
        "similar_count": len(partial),
        "missing_count": len(missing),
    }