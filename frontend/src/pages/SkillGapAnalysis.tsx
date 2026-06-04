import { useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";
import type { SkillGapResult } from "@/types";

const COLORS = {
  matched: "hsl(152, 60%, 42%)",
  missing: "hsl(0, 72%, 51%)",
};

const SkillGapAnalysis = () => {
  const { skills, selectedRole, analysisResult, setAnalysisResult } = useAppContext();
  const api = useApi<SkillGapResult>();

  useEffect(() => {
    if (selectedRole && skills.length > 0) {
      // ✅ Fixed: correct endpoint + correct field names
      api.request("/api/analysis/match", {
        method: "POST",
        body: JSON.stringify({ role: selectedRole, skills }),
      }).then((result) => {
        if (result) setAnalysisResult(result);
      }).catch(() => {});
    }
  }, [selectedRole, skills]);

  const result = analysisResult ?? api.data;

  if (!selectedRole) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
        <p className="text-muted-foreground mt-2">Select a role first to run the analysis.</p>
      </div>
    );
  }

  if (api.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
        <p className="text-muted-foreground mt-2">No analysis results yet. Click "Analyze Match" on a job listing.</p>
      </div>
    );
  }

  const pieData = [
    { name: "Matched", value: result.matched_skills.length, color: COLORS.matched },
    { name: "Missing", value: result.missing_skills.length, color: COLORS.missing },
  ];

  const barData = [
    { name: "Matched", count: result.matched_skills.length, fill: COLORS.matched },
    { name: "Missing", count: result.missing_skills.length, fill: COLORS.missing },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Skill Gap Analysis</h1>
        <p className="text-muted-foreground mt-1">Analyzing your fit for: <strong>{result.role}</strong></p>
      </div>

      {/* Match Score Circle */}
      <Card>
        <CardContent className="pt-6 flex flex-col items-center">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={COLORS.matched}
                strokeWidth="8"
                strokeDasharray={`${result.match_score * 2.64} ${264 - result.match_score * 2.64}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{result.match_score}%</span>
              <span className="text-xs text-muted-foreground">{result.match_level}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {result.matched_count} of {result.total_role_skills} core skills matched
          </p>
        </CardContent>
      </Card>

      {/* Skill Sections */}
      <div className="grid gap-5 sm:grid-cols-2">
        <SkillSection title="Matched Skills" skills={result.matched_skills} variant="success" />
        <SkillSection title="Missing Skills" skills={result.missing_skills} variant="destructive" />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Skills Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Skills Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Top Recommendations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.recommendations.slice(0, 8).map((rec) => (
                <div key={rec.skill} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="font-medium text-sm">{rec.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{rec.demand_count} jobs</span>
                    <Badge variant={rec.priority === "High Priority" ? "destructive" : "secondary"} className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function SkillSection({ title, skills, variant }: { title: string; skills: string[]; variant: string }) {
  const colorMap: Record<string, string> = {
    success: "bg-green-50 text-green-700 border-green-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title} ({skills.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className={`text-xs px-2.5 py-1 rounded-full border ${colorMap[variant]}`}>{s}</span>
          ))}
          {skills.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default SkillGapAnalysis;