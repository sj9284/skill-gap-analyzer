import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { Brain, Target, AlertTriangle, Zap, Upload, Search, TrendingUp, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import type { BestRole } from "@/types";

interface DatasetStats {
  total_jobs: number;
  unique_roles: number;
  internships: number;
  full_time: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { skills, selectedRole, analysisResult } = useAppContext();
  const statsApi = useApi<DatasetStats>();
  const bestRolesApi = useApi<{ top_roles: BestRole[]; user_skill_count: number }>();

  useEffect(() => {
    // ✅ Load dataset stats on mount
    statsApi.request("/api/jobs/stats").catch(() => {});
  }, []);

  useEffect(() => {
    // ✅ Load best roles when skills are available
    if (skills.length > 0) {
      bestRolesApi.request("/api/analysis/best-roles", {
        method: "POST",
        body: JSON.stringify({ skills, top_n: 5 }),
      }).catch(() => {});
    }
  }, [skills]);

  const matchedCount = analysisResult?.matched_count ?? 0;
  const missingCount = analysisResult?.missing_count ?? 0;
  const matchScore = analysisResult?.match_score ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to SkillAlign</h1>
        <p className="text-muted-foreground mt-1">Your AI-powered career alignment dashboard</p>
      </div>

      {/* Quick Actions — shown when no skills yet */}
      {skills.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Get Started</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Upload your resume to extract skills and start your analysis
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/upload")}>
                <Upload className="mr-2 h-4 w-4" /> Upload Resume
              </Button>
              <Button variant="outline" onClick={() => navigate("/skills")}>
                Add Skills Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Your Skills"
          value={skills.length}
          icon={Brain}
          color="primary"
          subtitle={skills.length > 0 ? "skills extracted" : "upload resume to start"}
        />
        <StatCard
          title="Match Score"
          value={analysisResult ? `${matchScore}%` : "—"}
          icon={Target}
          color="success"
          subtitle={analysisResult ? analysisResult.match_level : "run analysis to see"}
        />
        <StatCard
          title="Skills Matched"
          value={matchedCount || "—"}
          icon={Zap}
          color="success"
          subtitle={analysisResult ? `for ${analysisResult.role}` : "no role selected"}
        />
        <StatCard
          title="Skills Missing"
          value={missingCount || "—"}
          icon={AlertTriangle}
          color="destructive"
          subtitle={analysisResult ? "skills to learn" : "no analysis yet"}
        />
      </div>

      {/* Dataset Stats */}
      {statsApi.data && (
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{statsApi.data.total_jobs.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Job Listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{statsApi.data.unique_roles}</p>
              <p className="text-sm text-muted-foreground mt-1">Unique Roles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{statsApi.data.internships}</p>
              <p className="text-sm text-muted-foreground mt-1">Internship Opportunities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Match Overview — {analysisResult.role}
              <Badge variant={matchScore >= 50 ? "default" : "secondary"}>
                {analysisResult.match_level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Match Score</span>
                <span className="font-semibold">{matchScore}%</span>
              </div>
              <Progress value={matchScore} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-green-700 font-medium">{matchedCount} Matched Skills</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {analysisResult.matched_skills.slice(0, 4).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs text-green-700 border-green-300">{s}</Badge>
                  ))}
                  {analysisResult.matched_skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">+{analysisResult.matched_skills.length - 4} more</Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <p className="text-red-700 font-medium">{missingCount} Missing Skills</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {analysisResult.missing_skills.slice(0, 4).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs text-red-700 border-red-300">{s}</Badge>
                  ))}
                  {analysisResult.missing_skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">+{analysisResult.missing_skills.length - 4} more</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => navigate("/analysis")} size="sm">
                View Full Analysis <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button onClick={() => navigate("/recommendations")} variant="outline" size="sm">
                View Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Matching Roles */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Best Roles For Your Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestRolesApi.loading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            )}
            {bestRolesApi.data && (
              <div className="space-y-3">
                {bestRolesApi.data.top_roles.map((role) => (
                  <div
                    key={role.role}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                    onClick={() => navigate("/categories")}
                  >
                    <div>
                      <p className="font-medium text-sm">{role.role}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.matched_count} skills matched · {role.missing_count} missing
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{role.match_score}%</p>
                        <p className="text-xs text-muted-foreground">{role.match_level}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!bestRolesApi.loading && !bestRolesApi.data && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Upload your resume to see your best matching roles
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Browse Jobs", desc: "Explore roles by category", icon: Search, path: "/categories" },
          { label: "Market Insights", desc: "See top skills in demand", icon: TrendingUp, path: "/insights" },
          { label: "Skill Gap Analysis", desc: "Analyze your fit for a role", icon: Target, path: "/analysis" },
        ].map(({ label, desc, icon: Icon, path }) => (
          <Card
            key={label}
            className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
            onClick={() => navigate(path)}
          >
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

function StatCard({
  title, value, icon: Icon, color, subtitle
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-green-600 bg-green-50",
    destructive: "text-red-500 bg-red-50",
  };
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorMap[color] ?? colorMap.primary}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;