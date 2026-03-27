import pandas as pd
from pathlib import Path
from app.utils.skill_taxonomy import is_valid_skill, normalize_skill

# Path to CSV
DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "internshala_jobs.csv"

# In-memory cache — loaded once on first call
_jobs_df = None

def _load_data() -> pd.DataFrame:
    """Load and clean the CSV. Called once, result is cached."""
    global _jobs_df
    if _jobs_df is not None:
        return _jobs_df

    df = pd.read_csv(DATA_PATH)

    # Fill nulls
    df["skills"] = df["skills"].fillna("")
    df["location"] = df["location"].fillna("Remote")
    df["duration"] = df["duration"].fillna("N/A")
    df["posted_date"] = df["posted_date"].fillna("N/A")

    # Parse skills column → clean list of skills per row
    df["skills_list"] = df["skills"].apply(_parse_skills)

    # Normalize role names (strip whitespace)
    df["role"] = df["role"].str.strip()

    _jobs_df = df
    return _jobs_df


def _parse_skills(raw: str) -> list[str]:
    """Split pipe-separated skills and filter out non-skill tokens."""
    if not raw or pd.isna(raw):
        return []
    tokens = [t.strip() for t in raw.split("|")]
    return [t for t in tokens if is_valid_skill(t)]


# ─────────────────────────────────────────
# Public API used by routes
# ─────────────────────────────────────────

def get_all_roles() -> list[dict]:
    """Return all unique roles with job count."""
    df = _load_data()
    role_counts = df["role"].value_counts().reset_index()
    role_counts.columns = ["role", "count"]
    return role_counts.to_dict(orient="records")


def get_roles_by_type(job_type: str = None) -> list[dict]:
    """Return roles filtered by job_type (Internship / Full-time)."""
    df = _load_data()
    if job_type:
        df = df[df["job_type"].str.lower() == job_type.lower()]
    role_counts = df["role"].value_counts().reset_index()
    role_counts.columns = ["role", "count"]
    return role_counts.to_dict(orient="records")


def get_skills_for_role(role: str) -> list[str]:
    """Return all unique skills required for a given role."""
    df = _load_data()
    matched = df[df["role"].str.lower() == role.lower()]
    all_skills = []
    for skill_list in matched["skills_list"]:
        all_skills.extend(skill_list)
    # Return unique skills sorted by frequency
    from collections import Counter
    counts = Counter(all_skills)
    return [skill for skill, _ in counts.most_common()]


def get_jobs_for_role(role: str) -> list[dict]:
    """Return all job listings for a given role."""
    df = _load_data()
    matched = df[df["role"].str.lower() == role.lower()]
    return matched[[
        "role", "company", "location", "salary",
        "job_type", "duration", "skills_list", "job_url"
    ]].to_dict(orient="records")


def get_top_skills(top_n: int = 20) -> list[dict]:
    """Return the most in-demand skills across all jobs."""
    df = _load_data()
    from collections import Counter
    all_skills = []
    for skill_list in df["skills_list"]:
        all_skills.extend([normalize_skill(s) for s in skill_list])
    counts = Counter(all_skills)
    return [{"skill": s, "count": c} for s, c in counts.most_common(top_n)]


def get_dataset_stats() -> dict:
    """Return high-level stats about the dataset."""
    df = _load_data()
    return {
        "total_jobs": len(df),
        "unique_roles": df["role"].nunique(),
        "internships": int((df["job_type"] == "Internship").sum()),
        "full_time": int((df["job_type"] == "Full-time").sum()),
    }