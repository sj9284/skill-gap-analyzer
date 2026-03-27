from collections import Counter
from app.services.job_loader import _load_data
from app.utils.skill_taxonomy import normalize_skill


def get_top_skills_demand(top_n: int = 20) -> list[dict]:
    """
    Top N most in-demand skills across all jobs.
    """
    df = _load_data()
    all_skills = []
    for skill_list in df["skills_list"]:
        all_skills.extend([s.strip() for s in skill_list])

    counts = Counter(all_skills)
    return [
        {"skill": skill, "count": count, "percentage": round(count / len(df) * 100, 1)}
        for skill, count in counts.most_common(top_n)
    ]


def get_top_roles_demand(top_n: int = 20) -> list[dict]:
    """
    Top N most frequently posted roles.
    """
    df = _load_data()
    counts = df["role"].value_counts().head(top_n)
    total = len(df)
    return [
        {
            "role": role,
            "count": int(count),
            "percentage": round(count / total * 100, 1)
        }
        for role, count in counts.items()
    ]


def get_job_type_breakdown() -> dict:
    """
    Internship vs Full-time breakdown.
    """
    df = _load_data()
    counts = df["job_type"].value_counts()
    total = len(df)
    return {
        "total": total,
        "breakdown": [
            {
                "type": job_type,
                "count": int(count),
                "percentage": round(count / total * 100, 1)
            }
            for job_type, count in counts.items()
        ]
    }


def get_location_demand(top_n: int = 10) -> list[dict]:
    """
    Top N locations with most job postings.
    """
    df = _load_data()
    # Filter out Remote/NaN
    location_df = df[df["location"].str.lower() != "remote"]
    counts = location_df["location"].value_counts().head(top_n)
    total = len(location_df)
    return [
        {
            "location": location,
            "count": int(count),
            "percentage": round(count / total * 100, 1)
        }
        for location, count in counts.items()
    ]


def get_salary_insights() -> dict:
    """
    Salary range insights across all jobs.
    Parses salary strings and extracts numeric ranges.
    """
    import re
    df = _load_data()

    salaries = []
    for sal in df["salary"].dropna():
        # Extract numbers from salary strings like "15000-25000"
        numbers = re.findall(r'\d+', str(sal).replace(",", ""))
        if numbers:
            salaries.extend([int(n) for n in numbers if int(n) > 1000])

    if not salaries:
        return {"message": "No salary data available"}

    return {
        "min": min(salaries),
        "max": max(salaries),
        "average": round(sum(salaries) / len(salaries), 0),
        "sample_count": len(salaries)
    }


def get_skills_by_role_type() -> dict:
    """
    Top 10 skills for Internships vs Full-time separately.
    """
    df = _load_data()

    result = {}
    for job_type in ["Internship", "Full-time"]:
        subset = df[df["job_type"] == job_type]
        all_skills = []
        for skill_list in subset["skills_list"]:
            all_skills.extend([s.strip() for s in skill_list])
        counts = Counter(all_skills)
        result[job_type] = [
            {"skill": skill, "count": count}
            for skill, count in counts.most_common(10)
        ]

    return result


def get_full_market_overview() -> dict:
    """
    Single endpoint that returns all market insights at once.
    Used by the frontend dashboard.
    """
    return {
        "top_skills": get_top_skills_demand(15),
        "top_roles": get_top_roles_demand(10),
        "job_type_breakdown": get_job_type_breakdown(),
        "top_locations": get_location_demand(8),
        "salary_insights": get_salary_insights(),
        "skills_by_job_type": get_skills_by_role_type()
    }