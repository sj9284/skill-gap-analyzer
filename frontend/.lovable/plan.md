

# Skill Gap Analysis & Job Alignment System

## Overview
A premium SaaS dashboard with 11 pages, sidebar navigation, and fully API-ready components. All data flows through React state/props with no hardcoded data — ready for Flask backend integration.

## Architecture
- **State Management**: React Context for user skills, selected role, and job data
- **API Layer**: Custom hooks (`useApi`) with loading/error states for each endpoint
- **Routing**: React Router for all 11 pages
- **Charts**: Recharts for pie/bar charts
- **UI**: shadcn/ui components + Tailwind with a modern dark/light SaaS theme

## Sidebar Navigation
Collapsible sidebar with icons: Dashboard, Upload Resume, My Skills, Job Categories, Market Insights, Recommendations, Career Roadmap, Role Comparison

## Pages

### 1. Dashboard
- Welcome banner with user name from state
- Role selector dropdown (populated from API)
- Match score circular progress (if analysis done)
- Stat cards: Total / Matched / Missing skills
- "Start Analysis" CTA button

### 2. Upload Resume
- Drag & drop zone accepting PDF/DOCX
- Upload progress indicator
- After upload: extracted skills displayed as tags
- "Proceed to My Skills" button

### 3. My Skills (Core Feature)
- Tag/chip display of all skills (extracted + manual)
- Input field with "Add" button, duplicate prevention
- Auto-suggestion dropdown (Python, React, SQL, ML, etc. — fetched from API)
- Remove button (×) on each tag
- Newly added skills highlighted with accent color

### 4. Job Categories
- Grid of category cards (Core Tech, AI/ML, Business, etc.)
- Each card shows category name + dynamic role count from API
- Click navigates to Roles page filtered by category

### 5. Roles Page
- Search bar + filter controls
- Role cards within selected category
- Click navigates to Job Listings for that role

### 6. Job Listings
- Job cards rendering all backend fields: role, company, location, experience, salary, job_type, duration, posted_date, skills (as tags), description preview
- "Analyze Match" button → triggers gap analysis
- "Apply Now" button → opens `job_url` in new tab

### 7. Skill Gap Analysis
- Selected role header
- Circular progress for match score
- Insight text summary
- Three skill sections: Matched (green), Missing (red), Extra (blue)
- Pie chart (matched vs missing) + Bar chart breakdown via Recharts

### 8. Recommendations
- Missing skills list
- Suggested courses and projects per skill
- Action buttons for each recommendation

### 9. Market Insights
- Top skills bar chart (frequency-based)
- Top roles ranking
- Category distribution pie chart
- All data from API

### 10. Career Roadmap
- Vertical timeline of learning stages
- Skills required at each stage
- Progress indicators

### 11. Role Comparison
- Two role selector dropdowns
- Side-by-side skill comparison table
- Color-coded differences (shared, unique to each)

## Design System
- Modern SaaS aesthetic: rounded corners, soft shadows, card-based layouts
- Color coding: Green (matched), Red (missing), Blue (info)
- Smooth page transitions
- Fully responsive grid layouts
- shadcn/ui components throughout

## API Integration Pattern
- All pages use custom hooks that return `{ data, loading, error }`
- Loading skeletons on every page
- Error states with retry buttons
- Base URL configurable via environment variable (`VITE_API_BASE_URL`)

