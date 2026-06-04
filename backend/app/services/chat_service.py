import os
from google import genai
from app.services.job_loader import get_skills_for_role, _load_data
from app.services.skill_matcher import calculate_match, get_recommendations
from app.services.insights import get_full_market_overview

# ✅ Initialize Gemini client
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

# ─────────────────────────────────────────
# Intent Detection
# Order matters — more specific intents first
# ─────────────────────────────────────────

INTENT_KEYWORDS = {
    "learning_path": [
        "learning path", "roadmap", "how to learn",
        "where to start", "beginner", "study plan",
        "get started", "learn path", "path for",
        "path to become", "how do i become"
    ],
    "missing_skills": [
        "missing", "lack", "need to learn", "skill gap",
        "what skills", "which skills", "don't have",
        "lagging", "lacking", "weak in", "improve",
        "should i learn", "what should i learn",
        "what to learn", "learn now", "skills i need"
    ],
    "best_roles": [
        "best role", "best job", "suitable role", "which role",
        "what job", "suited for", "fit for",
        "recommend role", "matching role"
    ],
    "market_insights": [
        "top skills", "in demand", "market", "trending",
        "popular skills", "most wanted", "industry",
        "job market", "insights"
    ],
    "my_skills": [
        "my skills", "what skills do i have", "show my skills",
        "list my skills", "skills i have"
    ],
    "role_skills": [
        "skills for", "required for", "needed for",
        "skills needed", "role requires", "what does"
    ],
    "salary": [
        "salary", "compensation", "income",
        "stipend", "package", "ctc", "how much earn",
        "how much does", "pay scale"
    ],
    "greeting": [
        "hi", "hello", "hey", "good morning",
        "good evening", "what can you do", "help"
    ],
}


def detect_intent(message: str) -> str:
    """
    Detect the intent of a user message.
    Order matters — specific intents checked before generic ones.
    """
    message_lower = message.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in message_lower:
                return intent
    return "general"


def extract_role_from_message(message: str) -> str:
    """Try to extract a role name from the message."""
    df = _load_data()
    all_roles = df["role"].str.lower().tolist()
    message_lower = message.lower()
    for role in all_roles:
        if role in message_lower:
            original = df[df["role"].str.lower() == role]["role"].iloc[0]
            return original
    return ""


# ─────────────────────────────────────────
# Rule Based Handlers (Free + Instant)
# ─────────────────────────────────────────

def handle_greeting() -> str:
    return """👋 Hi! I'm **SkillAlign AI Assistant**.

I can help you with:
- 🎯 **Skill Gap Analysis** — "What skills am I missing for Full Stack?"
- 🏆 **Best Roles** — "What are my best matching roles?"
- 📊 **Market Insights** — "What are the top skills in demand?"
- 💰 **Salary Info** — "What's the salary range?"
- 🎓 **Learning Path** — "Give me a learning path for Data Science"
- 🗺️ **Career Advice** — "Should I learn Python or JavaScript?"

What would you like to know?"""


def handle_missing_skills(message: str, user_skills: list[str]) -> str:
    """Handle skill gap and learning questions."""
    if not user_skills:
        return "⚠️ Please upload your resume or add skills first!"

    role = extract_role_from_message(message)

    # No specific role mentioned — show general top missing skills
    if not role:
        # Get top in-demand skills user doesn't have
        insights = get_full_market_overview()
        top_skills = [s["skill"] for s in insights["top_skills"][:20]]
        user_norms = [s.lower() for s in user_skills]
        missing = [s for s in top_skills if s.lower() not in user_norms]

        response = "## 📚 Skills You Should Learn\n\n"
        response += f"Based on market demand and your {len(user_skills)} current skills:\n\n"
        response += "**🔴 High Priority (most in-demand):**\n"
        for skill in missing[:5]:
            skill_data = next((s for s in insights["top_skills"] if s["skill"] == skill), None)
            if skill_data:
                response += f"  - **{skill}** — {skill_data['count']} job postings\n"

        response += "\n💡 *Tip: Ask 'What skills am I missing for [role]?' for role-specific gaps!*"
        return response

    result = calculate_match(user_skills, role)
    if "error" in result:
        return f"❌ Couldn't find role: **{role}**. Try a different role name."

    recommendations = get_recommendations(result["missing_skills"], role)

    response = f"## Skill Gap for **{role}**\n\n"
    response += f"**Match Score: {result['match_score']}%** ({result['match_level']})\n\n"

    if result["matched_skills"]:
        response += f"✅ **You have {result['matched_count']} matching skills:**\n"
        for skill in result["matched_skills"][:5]:
            response += f"  - {skill}\n"
        if len(result["matched_skills"]) > 5:
            response += f"  - *...and {len(result['matched_skills']) - 5} more*\n"

    response += f"\n❌ **Top missing skills:**\n"
    for rec in recommendations[:5]:
        response += f"  - **{rec['skill']}** — {rec['demand_count']} jobs ({rec['priority']})\n"

    return response


def handle_best_roles(user_skills: list[str]) -> str:
    if not user_skills:
        return "⚠️ Please upload your resume or add skills first!"

    from app.services.skill_matcher import get_best_roles
    results = get_best_roles(user_skills, top_n=5)

    if not results:
        return "❌ Couldn't find matching roles. Try adding more skills!"

    response = "## 🏆 Your Best Matching Roles\n\n"
    for i, role in enumerate(results, 1):
        emoji = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i-1]
        response += f"{emoji} **{role['role']}**\n"
        response += f"   Match: {role['match_score']}% | "
        response += f"Matched: {role['matched_count']} | "
        response += f"Missing: {role['missing_count']}\n\n"

    return response


def handle_market_insights() -> str:
    insights = get_full_market_overview()

    response = "## 📊 Job Market Insights\n\n"
    response += "**🔥 Top 10 In-Demand Skills:**\n"
    for skill in insights["top_skills"][:10]:
        response += f"  - **{skill['skill']}** — {skill['count']} jobs\n"

    response += f"\n**💼 Job Types:**\n"
    for jt in insights["job_type_breakdown"]["breakdown"]:
        response += f"  - {jt['type']}: {jt['count']} jobs ({jt['percentage']}%)\n"

    response += f"\n**💰 Salary Range:**\n"
    sal = insights["salary_insights"]
    response += f"  - Average: ₹{sal['average']:,.0f}/month\n"
    response += f"  - Min: ₹{sal['min']:,.0f} | Max: ₹{sal['max']:,.0f}\n"

    return response


def handle_my_skills(user_skills: list[str]) -> str:
    if not user_skills:
        return "⚠️ No skills loaded yet. Upload your resume first!"

    response = f"## 🧠 Your Skills ({len(user_skills)} total)\n\n"
    for i, skill in enumerate(user_skills, 1):
        response += f"{i}. {skill}\n"
    return response


def handle_role_skills(message: str) -> str:
    role = extract_role_from_message(message)
    if not role:
        return "Which role are you asking about? Example: *'What skills are needed for Data Science?'*"

    skills = get_skills_for_role(role)[:15]
    if not skills:
        return f"❌ Couldn't find role: **{role}**"

    response = f"## 📋 Skills for **{role}**\n\n"
    for i, skill in enumerate(skills, 1):
        response += f"{i}. {skill}\n"
    return response


def handle_salary() -> str:
    insights = get_full_market_overview()
    sal = insights["salary_insights"]

    response = "## 💰 Salary Insights\n\n"
    response += f"Based on **{sal['sample_count']}** job listings:\n\n"
    response += f"- **Average:** ₹{sal['average']:,.0f}/month\n"
    response += f"- **Minimum:** ₹{sal['min']:,.0f}/month\n"
    response += f"- **Maximum:** ₹{sal['max']:,.0f}/month\n\n"
    response += "*Note: Salaries vary by role, experience and company.*"
    return response


def handle_learning_path(message: str, user_skills: list[str]) -> str:
    """Generate a personalized learning path based on role and user skills."""
    role = extract_role_from_message(message)

    if not role:
        return """## 🎓 Learning Path

To get a personalized learning path, specify a role:
- *"Learning path for Full Stack Development"*
- *"Roadmap for Data Science"*
- *"How to become a Python Developer"*
- *"Learning path for Machine Learning"*"""

    skills = get_skills_for_role(role)[:15]

    response = f"## 🎓 Learning Path for **{role}**\n\n"

    if user_skills:
        result = calculate_match(user_skills, role)
        matched = result.get("matched_skills", [])
        missing = result.get("missing_skills", [])
        score = result.get("match_score", 0)

        response += f"**Your current match: {score}%**\n\n"

        response += "**✅ Phase 1 — Skills you already have:**\n"
        if matched:
            for s in matched[:6]:
                clean = s.split("(~")[0].strip()
                response += f"  ✅ {clean}\n"
        else:
            response += "  *None yet — start from Phase 2*\n"

        response += "\n**📚 Phase 2 — Learn these next (High Priority):**\n"
        recs = get_recommendations(missing, role)
        high = [r["skill"] for r in recs if r["priority"] == "High Priority"]
        for i, s in enumerate(high[:4], 1):
            response += f"  {i}. **{s}** ← Most in-demand\n"

        response += "\n**📖 Phase 3 — Learn these after (Medium Priority):**\n"
        medium = [r["skill"] for r in recs if r["priority"] == "Medium Priority"]
        for i, s in enumerate(medium[:4], 1):
            response += f"  {i}. {s}\n"

        if not high and not medium:
            response += "\n**📖 Phase 3 — Remaining skills:**\n"
            for i, s in enumerate(missing[:4], 1):
                response += f"  {i}. {s}\n"

    else:
        response += "**Core skills to master in order:**\n\n"
        response += "**Phase 1 — Fundamentals:**\n"
        for i, s in enumerate(skills[:5], 1):
            response += f"  {i}. {s}\n"

        response += "\n**Phase 2 — Intermediate:**\n"
        for i, s in enumerate(skills[5:10], 1):
            response += f"  {i}. {s}\n"

        response += "\n**Phase 3 — Advanced:**\n"
        for i, s in enumerate(skills[10:15], 1):
            response += f"  {i}. {s}\n"

    response += "\n💡 *Tip: Upload your resume for a personalized path based on your current skills!*"
    return response


# ─────────────────────────────────────────
# Gemini AI Handler (Free tier)
# ─────────────────────────────────────────

def handle_with_gemini(
    message: str,
    user_skills: list[str],
    conversation_history: list[dict]
) -> str:
    """Handle complex questions using Google Gemini AI."""

    insights = get_full_market_overview()
    top_skills = [s["skill"] for s in insights["top_skills"][:10]]
    top_roles = [r["role"] for r in insights["top_roles"][:10]]

    history_text = ""
    for msg in conversation_history[-4:]:
        role_label = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role_label}: {msg['content']}\n"

    prompt = f"""You are SkillAlign AI, a career assistant for an AI-powered skill gap analysis system focused on the Indian job market.

Dataset context (Internshala job listings):
- Total jobs: 1,034
- Top in-demand skills: {', '.join(top_skills)}
- Top hiring roles: {', '.join(top_roles)}
- Job types: 80% Internships, 20% Full-time
- Average salary: ₹{insights['salary_insights']['average']:,.0f}/month

User's current skills: {', '.join(user_skills) if user_skills else 'Not provided yet'}

Previous conversation:
{history_text}

User's question: {message}

Instructions:
- Give concise practical career advice (under 200 words)
- Reference the dataset when relevant
- Use markdown formatting with bullet points
- Be encouraging and supportive
- Focus on Indian job market context
- If asked about specific roles mention skills from the dataset

Answer:"""

    try:
        response = gemini_client.models.generate_content(
            model="models/gemma-4-26b-a4b-it",
            contents=prompt
        )
        return response.text
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            return """## 🤖 AI Quota Reached

The free Gemini AI quota has been reached for now.

**But I can still help you with:**
- "What skills am I missing for [role]?"
- "What should I learn now?"
- "What are my best matching roles?"
- "What are the top skills in demand?"
- "Give me a learning path for [role]"
- "Show my skills"
- "Salary insights"

⏰ Try again in a few minutes for AI-powered responses!"""
        return f"""I can help you with that!

**Your Skills:** {', '.join(user_skills[:5]) if user_skills else 'None loaded yet'}

Try asking me:
- "What skills am I missing for [role]?"
- "What are my best matching roles?"
- "Give me a learning path for Full Stack Development"

*Note: AI service temporarily unavailable.*"""


# ─────────────────────────────────────────
# Main Chat Handler
# ─────────────────────────────────────────

def process_message(
    message: str,
    user_skills: list[str],
    conversation_history: list[dict]
) -> dict:
    """
    Main chat processing function.
    Routes to rule-based or Gemini AI based on intent.
    """
    intent = detect_intent(message)

    if intent == "greeting":
        response = handle_greeting()
        method = "rule_based"
    elif intent == "learning_path":
        response = handle_learning_path(message, user_skills)
        method = "rule_based"
    elif intent == "missing_skills":
        response = handle_missing_skills(message, user_skills)
        method = "rule_based"
    elif intent == "best_roles":
        response = handle_best_roles(user_skills)
        method = "rule_based"
    elif intent == "market_insights":
        response = handle_market_insights()
        method = "rule_based"
    elif intent == "my_skills":
        response = handle_my_skills(user_skills)
        method = "rule_based"
    elif intent == "role_skills":
        response = handle_role_skills(message)
        method = "rule_based"
    elif intent == "salary":
        response = handle_salary()
        method = "rule_based"
    else:
        response = handle_with_gemini(
            message, user_skills, conversation_history
        )
        method = "gemini_ai"

    return {
        "response": response,
        "intent": intent,
        "method": method
    }
