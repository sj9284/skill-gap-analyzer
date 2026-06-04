export interface Job {
  role: string;
  company: string;
  experience: string;
  location: string;
  salary: string;
  skills_list: string[];
  description: string;
  job_type: string;
  duration: string;
  posted_date: string;
  job_url: string;
}

export interface JobCategory {
  id: string;
  name: string;
  icon: string;
  roleCount: number;
}

export interface RoleInfo {
  role: string;
  count: number;
}

export interface Recommendation {
  skill: string;
  demand_count: number;
  priority: string;
}

export interface SkillGapResult {
  role: string;
  match_score: number;
  match_level: string;
  total_role_skills: number;
  matched_count: number;
  missing_count: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: Recommendation[];
}

export interface MarketInsight {
  top_skills: { skill: string; count: number; percentage: number }[];
  top_roles: { role: string; count: number; percentage: number }[];
  job_type_breakdown: {
    total: number;
    breakdown: { type: string; count: number; percentage: number }[];
  };
  salary_insights: {
    min: number;
    max: number;
    average: number;
    sample_count: number;
  };
  skills_by_job_type: {
    Internship: { skill: string; count: number }[];
    "Full-time": { skill: string; count: number }[];
  };
}

export interface BestRole {
  role: string;
  match_score: number;
  match_level: string;
  matched_count: number;
  missing_count: number;
  total_role_skills: number;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}