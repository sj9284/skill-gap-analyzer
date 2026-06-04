import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { SkillGapResult } from "@/types";

interface AppState {
  userName: string;
  setUserName: (name: string) => void;
  skills: string[];
  addSkill: (skill: string) => boolean;
  removeSkill: (skill: string) => void;
  setSkills: (skills: string[]) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  analysisResult: SkillGapResult | null;
  setAnalysisResult: (result: SkillGapResult | null) => void;
  resumeUploaded: boolean;
  setResumeUploaded: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userName, setUserName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [analysisResult, setAnalysisResult] = useState<SkillGapResult | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const addSkill = useCallback((skill: string): boolean => {
    const normalized = skill.trim();
    if (!normalized) return false;
    if (skills.some((s) => s.toLowerCase() === normalized.toLowerCase())) return false;
    setSkills((prev) => [...prev, normalized]);
    return true;
  }, [skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  return (
    <AppContext.Provider
      value={{
        userName, setUserName,
        skills, addSkill, removeSkill, setSkills,
        selectedRole, setSelectedRole,
        selectedCategory, setSelectedCategory,
        analysisResult, setAnalysisResult,
        resumeUploaded, setResumeUploaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
