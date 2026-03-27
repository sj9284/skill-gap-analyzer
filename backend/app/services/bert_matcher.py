import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.utils.skill_taxonomy import normalize_skill

# ─────────────────────────────────────────
# REFINED SEMANTIC GROUPS
# Specific groups to avoid false matches
# ─────────────────────────────────────────
SEMANTIC_GROUPS = {

    # JavaScript frameworks only
    "js_frameworks": [
        "react", "angular", "vue.js", "next.js", "nuxt.js",
        "gatsby", "svelte", "redux", "angularjs", "react.js",
        "remix", "astro"
    ],

    # CSS core only
    "css_core": [
        "css", "css3", "scss", "sass", "less"
    ],

    # CSS frameworks — separate from core CSS
    "css_frameworks": [
        "bootstrap", "tailwind css", "styled components",
        "material ui", "chakra ui", "ant design"
    ],

    # HTML/Markup only
    "markup_languages": [
        "html", "html5", "xml", "markdown", "pug", "ejs"
    ],

    # JavaScript ecosystem — separate from HTML
    "js_ecosystem": [
        "javascript", "typescript", "jquery",
        "webpack", "babel", "vite", "eslint"
    ],

    # Build tools
    "build_tools": [
        "webpack", "vite", "babel", "gulp",
        "grunt", "rollup", "parcel"
    ],

    # Python backend frameworks only
    "python_backend": [
        "django", "flask", "fastapi", "pyramid", "tornado"
    ],

    # JavaScript backend only
    "js_backend": [
        "node.js", "express.js", "nest.js", "fastify", "koa"
    ],

    # PHP frameworks only
    "php_backend": [
        "php", "laravel", "codeigniter", "symfony", "wordpress"
    ],

    # Java backend only
    "java_backend": [
        "java", "spring boot", "spring", "hibernate",
        "javafx", "maven", "gradle"
    ],

    # REST API specifically
    "rest_api": [
        "rest api", "restful api", "rest",
        "restful", "web services"
    ],

    # General APIs
    "api_general": [
        "apis", "api development", "api integration",
        "api design", "backend development"
    ],

    # Modern API protocols
    "modern_api": [
        "graphql", "grpc", "soap", "websocket"
    ],

    # SQL databases only
    "sql_databases": [
        "mysql", "postgresql", "sqlite", "oracle",
        "sql server", "mariadb", "sql"
    ],

    # NoSQL databases only
    "nosql_databases": [
        "mongodb", "redis", "firebase", "cassandra",
        "dynamodb", "elasticsearch", "couchdb"
    ],

    # ML/AI core concepts
    "ml_core": [
        "machine learning", "deep learning",
        "artificial intelligence", "neural networks",
        "reinforcement learning", "supervised learning",
        "unsupervised learning"
    ],

    # ML frameworks
    "ml_frameworks": [
        "tensorflow", "pytorch", "keras", "scikit-learn",
        "xgboost", "lightgbm", "hugging face"
    ],

    # Computer Vision
    "ml_vision": [
        "computer vision", "opencv", "image processing",
        "object detection", "image recognition"
    ],

    # NLP
    "ml_nlp": [
        "natural language processing", "nlp", "text mining",
        "sentiment analysis", "bert", "gpt",
        "large language models"
    ],

    # Data science tools
    "data_science": [
        "data science", "data analytics", "data analysis",
        "statistics", "pandas", "numpy", "matplotlib",
        "seaborn", "plotly", "tableau", "power bi"
    ],

    # Data engineering
    "data_engineering": [
        "data engineering", "etl", "apache spark",
        "hadoop", "kafka", "airflow", "data pipeline",
        "data extraction", "data preprocessing",
        "data preparation"
    ],

    # Android development
    "android": [
        "android", "kotlin", "android studio",
        "android development", "android app development"
    ],

    # iOS development
    "ios": [
        "ios", "swift", "xcode", "objective-c"
    ],

    # Cross platform mobile
    "cross_platform_mobile": [
        "flutter", "react native", "dart",
        "xamarin", "ionic", "capacitor"
    ],

    # DevOps tools
    "devops_tools": [
        "docker", "kubernetes", "jenkins", "ansible",
        "terraform", "ci/cd", "gitlab ci", "github actions"
    ],

    # Cloud AWS
    "cloud_aws": [
        "aws", "amazon web services (aws)", "aws lambda",
        "amazon ec2", "amazon s3", "aws rds"
    ],

    # Cloud Azure
    "cloud_azure": [
        "azure", "microsoft azure", "azure devops"
    ],

    # Cloud GCP
    "cloud_gcp": [
        "google cloud platforms (gcp)", "gcp",
        "google cloud", "bigquery"
    ],

    # Version control
    "version_control": [
        "git", "github", "gitlab", "bitbucket",
        "version control", "svn"
    ],

    # Testing
    "testing": [
        "selenium", "jest", "pytest", "junit",
        "cypress", "mocha", "jasmine", "playwright",
        "automation testing", "qa"
    ],

    # CS fundamentals
    "cs_fundamentals": [
        "data structures", "algorithms", "problem solving",
        "object oriented programming", "design patterns",
        "system design", "data structures and algorithms"
    ],

    # Automation
    "automation": [
        "automation", "robot framework",
        "puppeteer", "zapier", "scripting"
    ],

    # Cybersecurity
    "security": [
        "cybersecurity", "network security", "ethical hacking",
        "penetration testing", "cisco", "firewall",
        "information security"
    ],

    # UI/UX Design
    "design": [
        "ui", "ux", "figma", "adobe xd", "sketch",
        "ui & ux design", "web design", "graphic design",
        "canva", "invision", "wireframing"
    ],

    # Soft skills
    "soft_skills": [
        "communication", "teamwork", "leadership",
        "management", "agile methodology", "scrum",
        "project management", "time management"
    ],

    # Programming fundamentals
    "programming_fundamentals": [
        "object oriented programming", "data structures",
        "algorithms", "problem solving", "debugging",
        "software development life cycle (sdlc)"
    ],

    # Frontend development general
    "frontend_general": [
        "frontend development", "web development",
        "responsive design", "cross browser compatibility"
    ],

    # Backend development general
    "backend_general": [
        "backend development", "server side development",
        "microservices", "serverless"
    ],

    # Database general
    "database_general": [
        "database management system (dbms)",
        "database design", "database administration",
        "query optimization"
    ],
}

# Build reverse lookup: normalized skill → group name
SKILL_TO_GROUP = {}
for group, skills in SEMANTIC_GROUPS.items():
    for skill in skills:
        SKILL_TO_GROUP[skill.lower()] = group


def _get_semantic_similarity(skill_a: str, skill_b: str) -> float:
    """
    Calculate semantic similarity between two skills.
    Uses refined taxonomy groups for precision.

    Returns:
        1.0  → exact match
        0.75 → same semantic group (high confidence)
        0.05 → different groups (near zero — below threshold)
        ngram similarity → for unknown skills
    """
    norm_a = normalize_skill(skill_a).lower()
    norm_b = normalize_skill(skill_b).lower()

    # Exact match
    if norm_a == norm_b:
        return 1.0

    # Get semantic groups
    group_a = SKILL_TO_GROUP.get(norm_a)
    group_b = SKILL_TO_GROUP.get(norm_b)

    if group_a and group_b:
        if group_a == group_b:
            return 0.75  # Same group → semantically similar
        else:
            return 0.05  # Different group → not similar

    # Character n-gram fallback for unknown skills
    def ngrams(s, n=3):
        return set(s[i:i+n] for i in range(len(s) - n + 1))

    ngrams_a = ngrams(norm_a)
    ngrams_b = ngrams(norm_b)

    if not ngrams_a or not ngrams_b:
        return 0.0

    intersection = ngrams_a & ngrams_b
    union = ngrams_a | ngrams_b
    return len(intersection) / len(union)


def calculate_bert_match(
    user_skills: list[str],
    role_skills: list[str],
    threshold: float = 0.75
) -> dict:
    """
    Calculate semantic skill match using refined taxonomy.

    Threshold 0.75 means:
    - Exact matches (1.0) → always matched
    - Same group (0.75) → matched (at boundary)
    - Different group (0.05) → never matched
    - Unknown skills use n-gram fallback
    """
    exact_matched = []
    semantic_matched = []
    missing = []

    user_norms = [normalize_skill(s).lower() for s in user_skills]

    for role_skill in role_skills:
        role_norm = normalize_skill(role_skill).lower()

        # Check exact match first
        exact_found = False
        for i, user_skill in enumerate(user_skills):
            if user_norms[i] == role_norm:
                exact_matched.append({
                    "skill": role_skill,
                    "match_type": "exact",
                    "similarity": 1.0
                })
                exact_found = True
                break

        if exact_found:
            continue

        # Find best semantic match
        best_score = 0.0
        best_user_skill = ""

        for i, user_skill in enumerate(user_skills):
            score = _get_semantic_similarity(user_skill, role_skill)
            if score > best_score:
                best_score = score
                best_user_skill = user_skill

        if best_score >= threshold:
            semantic_matched.append({
                "skill": role_skill,
                "matched_with": best_user_skill,
                "match_type": "semantic",
                "similarity": round(best_score, 3)
            })
        else:
            missing.append({
                "skill": role_skill,
                "best_similarity": round(best_score, 3)
            })

    # Weighted score
    total = len(role_skills)
    if total == 0:
        score = 0.0
    else:
        exact_points = len(exact_matched) * 1.0
        semantic_points = sum(m["similarity"] for m in semantic_matched)
        score = round(
            ((exact_points + semantic_points) / total) * 100, 1
        )

    # Match level
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
        "exact_matched": exact_matched,
        "semantic_matched": semantic_matched,
        "missing_skills": [m["skill"] for m in missing],
        "exact_count": len(exact_matched),
        "semantic_count": len(semantic_matched),
        "missing_count": len(missing),
    }


def get_bert_similarity(skill_a: str, skill_b: str) -> float:
    """Public function for single skill comparison."""
    return _get_semantic_similarity(skill_a, skill_b)
