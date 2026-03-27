# ─────────────────────────────────────────
# NON-SKILL KEYWORDS (perks/benefits noise)
# ─────────────────────────────────────────
NON_SKILL_KEYWORDS = {
    "certificate", "letter of recommendation", "flexible work hours",
    "informal dress code", "free snacks & beverages", "5 days a week",
    "job offer", "pre-placement offer", "ipo", "equity", "esop",
    "work from home", "hybrid", "health insurance", "paid sick leaves",
    "annual bonus", "gratuity", "cab facility", "joining bonus",
    "life insurance", "recreational activities", "lodging",
    "travel allowance", "petrol allowance", "food allowance",
    "alternate saturday off", "weekly off", "overtime pay",
    "performance bonus"
}

# ─────────────────────────────────────────
# SYNONYM MAP
# Maps common aliases → canonical skill name
# ─────────────────────────────────────────
SKILL_SYNONYMS = {
    # JavaScript variants
    "js": "javascript",
    "javascript": "javascript",
    "es6": "javascript",
    "es2015": "javascript",
    "vanilla js": "javascript",
    "vanillajs": "javascript",

    # TypeScript
    "ts": "typescript",

    # Python
    "py": "python",
    "python3": "python",
    "python 3": "python",

    # React
    "reactjs": "react",
    "react.js": "react",
    "react js": "react",

    # Node.js
    "node": "node.js",
    "nodejs": "node.js",
    "node js": "node.js",

    # Machine Learning
    "ml": "machine learning",
    "machine learning": "machine learning",

    # Artificial Intelligence
    "ai": "artificial intelligence",
    "artificial intelligence": "artificial intelligence",

    # Deep Learning
    "dl": "deep learning",
    "deep learning": "deep learning",

    # Natural Language Processing
    "nlp": "natural language processing",
    "natural language processing": "natural language processing",

    # Computer Vision
    "cv": "computer vision",
    "computer vision": "computer vision",

    # Large Language Models
    "llm": "large language models",
    "llms": "large language models",
    "large language model": "large language models",

    # Database
    "sql": "sql",
    "mysql": "mysql",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "mongodb": "mongodb",
    "mongo": "mongodb",

    # CSS variants
    "css3": "css",
    "css 3": "css",

    # HTML variants
    "html5": "html",
    "html 5": "html",

    # REST API
    "rest": "rest api",
    "restful": "rest api",
    "restful api": "rest api",
    "rest apis": "rest api",
    "api": "apis",

    # Git/GitHub
    "git hub": "github",
    "gitlab": "git",

    # Cloud
    "aws": "amazon web services (aws)",
    "amazon web services": "amazon web services (aws)",
    "gcp": "google cloud platforms (gcp)",
    "google cloud": "google cloud platforms (gcp)",
    "azure": "microsoft azure",

    # Docker/DevOps
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",

    # Data Science
    "data science": "data science",
    "ds": "data science",

    # Data Analytics
    "data analytics": "data analytics",
    "data analysis": "data analytics",

    # TensorFlow
    "tensorflow": "tensorflow",
    "tf": "tensorflow",

    # PyTorch
    "pytorch": "pytorch",
    "torch": "pytorch",

    # Scikit-learn
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",

    # OpenCV
    "opencv": "opencv",
    "open cv": "opencv",

    # Spring Boot
    "spring": "spring boot",
    "springboot": "spring boot",

    # Android
    "android development": "android",
    "android app development": "android",

    # Flutter
    "flutter": "flutter",
    "dart": "flutter",

    # React Native
    "react-native": "react native",

    # Next.js
    "next": "next.js",
    "nextjs": "next.js",
    "next js": "next.js",

    # Vue.js
    "vue": "vue.js",
    "vuejs": "vue.js",
    "vue js": "vue.js",

    # Angular
    "angularjs": "angular",
    "angular js": "angular",

    # Express
    "express": "express.js",
    "expressjs": "express.js",
    "express js": "express.js",

    # Django
    "django": "django",
    "django rest framework": "django",
    "drf": "django",

    # Flask
    "flask": "flask",

    # FastAPI
    "fastapi": "fastapi",
    "fast api": "fastapi",

    # Tailwind
    "tailwind": "tailwind css",
    "tailwindcss": "tailwind css",

    # Bootstrap
    "bootstrap": "bootstrap",

    # Figma
    "figma": "figma",

    # Problem Solving
    "problem solving": "problem solving",
    "problem-solving": "problem solving",

    # Data Structures
    "data structures": "data structures",
    "dsa": "data structures",
    "data structures and algorithms": "data structures",

    # Algorithms
    "algorithms": "algorithms",
    "algo": "algorithms",

    # OOP
    "oop": "object oriented programming",
    "oops": "object oriented programming",
    "object oriented": "object oriented programming",
    "object-oriented programming": "object oriented programming",

    # Selenium
    "selenium": "selenium",
    "selenium webdriver": "selenium",

    # Kubernetes
    "k8": "kubernetes",

    # Redis
    "redis": "redis",

    # GraphQL
    "graphql": "graphql",
    "graph ql": "graphql",

    # CI/CD
    "ci/cd": "ci/cd",
    "cicd": "ci/cd",
    "continuous integration": "ci/cd",

    # Agile
    "agile": "agile methodology",
    "scrum": "agile methodology",
    "agile/scrum": "agile methodology",
}


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill string:
    1. Lowercase + strip
    2. Apply synonym mapping
    """
    cleaned = skill.strip().lower()
    # Check if it's in synonym map
    return SKILL_SYNONYMS.get(cleaned, cleaned)


def is_valid_skill(skill: str) -> bool:
    """Return True if the token looks like an actual skill."""
    cleaned = skill.strip().lower()
    if not cleaned:
        return False
    if cleaned in NON_SKILL_KEYWORDS:
        return False
    if len(cleaned) <= 1:
        return False
    return True


def get_canonical_skill(skill: str) -> str:
    """
    Get the canonical (standardized) form of a skill.
    Used for consistent storage and comparison.
    """
    return normalize_skill(skill)