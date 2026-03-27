import pdfplumber
import docx
import re
from pathlib import Path
from app.services.job_loader import get_top_skills, _load_data

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file."""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_text_from_docx(file_path: str) -> str:
    """Extract all text from a DOCX file."""
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])


def extract_text(file_path: str) -> str:
    """Auto-detect file type and extract text."""
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def extract_skills_from_text(text: str) -> list[str]:
    """
    Match resume text against known skills from the dataset.
    Returns a deduplicated list of matched skills.
    """
    if not text:
        return []

    # Load all unique skills from the dataset
    df = _load_data()
    all_skills = set()
    for skill_list in df["skills_list"]:
        for skill in skill_list:
            all_skills.add(skill.strip())

    text_lower = text.lower()
    matched = []

    for skill in all_skills:
        skill_lower = skill.lower()
        # Use word boundary matching to avoid partial matches
        # e.g. "R" shouldn't match "React"
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill_lower) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            matched.append(skill)

    # Sort alphabetically for consistent output
    return sorted(matched)


def parse_resume(file_path: str) -> dict:
    """
    Full pipeline: extract text → extract skills.
    Returns a dict with raw text and matched skills.
    """
    text = extract_text(file_path)
    skills = extract_skills_from_text(text)

    return {
        "raw_text_length": len(text),
        "skills": skills,
        "skill_count": len(skills)
    }