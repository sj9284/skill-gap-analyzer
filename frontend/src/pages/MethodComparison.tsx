import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FlaskConical, Zap, Clock, Target } from "lucide-react";

interface MethodResult {
  method: string;
  match_score: number;
  match_level: string;
  matched_count?: number;
  exact_count?: number;
  similar_count?: number;
  semantic_count?: number;
  missing_count: number;
  processing_time_seconds: number;
}

interface CompareResponse {
  role: string;
  user_skill_count: number;
  role_skill_count: number;
  results: {
    keyword_matching: MethodResult;
    tfidf_similarity: MethodResult;
    bert_semantic: MethodResult;
  };
  paper_summary: {
    best_accuracy: string;
    fastest: string;
    recommended: string;
  };
}

const METHOD_COLORS = {
  keyword_matching: "hsl(210, 100%, 52%)",
  tfidf_similarity: "hsl(38, 92%, 50%)",
  bert_semantic: "hsl(152, 60%, 42%)",
};

const METHOD_LABELS = {
  keyword_matching: "Level 1: Keyword",
  tfidf_similarity: "Level 2: TF-IDF",
  bert_semantic: "Level 3: Semantic",
};

const ROLES = [
  "Full Stack Development",
  "Data Science",
  "Machine Learning",
  "Python Development",
  "Artificial Intelligence (AI)",
  "Front End Development",
  "Backend Development",
  "Data Analytics",
  "Android App Development",
  "Software Development",
];

const MethodComparison = () => {
  const { skills } = useAppContext();
  const [selectedRole, setSelectedRole] = useState("");
  const api = useApi<CompareResponse>();

  const handleCompare = () => {
    if (!selectedRole || skills.length === 0) return;
    api.request("/api/analysis/compare-methods", {
      method: "POST",
      body: JSON.stringify({ skills, role: selectedRole }),
    }).catch(() => {});
  };

  const chartData = api.data
    ? [
        {
          name: "Level 1\nKeyword",
          score: api.data.results.keyword_matching.match_score,
          color: METHOD_COLORS.keyword_matching,
        },
        {
          name: "Level 2\nTF-IDF",
          score: api.data.results.tfidf_similarity.match_score,
          color: METHOD_COLORS.tfidf_similarity,
        },
        {
          name: "Level 3\nSemantic",
          score: api.data.results.bert_semantic.match_score,
          color: METHOD_COLORS.bert_semantic,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="h-8 w-8 text-primary" />
          Method Comparison
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare all 3 NLP matching approaches side by side
        </p>
      </div>

      {/* Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configure Experiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length === 0 && (
            <p className="text-amber-600 text-sm">
              ⚠️ Upload your resume or add skills first to run the comparison.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Your Skills ({skills.length} loaded)
              </label>
              <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground min-h-10">
                {skills.length > 0
                  ? skills.slice(0, 8).join(", ") + (skills.length > 8 ? ` +${skills.length - 8} more` : "")
                  : "No skills loaded"}
              </div>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Target Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCompare}
            disabled={!selectedRole || skills.length === 0 || api.loading}
            className="w-full sm:w-auto"
            size="lg"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            {api.loading ? "Running Analysis..." : "Run Method Comparison"}
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {api.loading && (
        <div className="grid gap-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {api.error && (
        <p className="text-destructive">{api.error}</p>
      )}

      {/* Results */}
      {api.data && (
        <div className="space-y-6">

          {/* Summary Bar */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Best Accuracy</p>
                  <p className="font-semibold text-green-600">Level 3: Semantic</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fastest Method</p>
                  <p className="font-semibold text-blue-600">Level 1: Keyword</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recommended</p>
                  <p className="font-semibold text-primary">Combined Pipeline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Method Cards */}
          <div className="grid gap-5 sm:grid-cols-3">
            {(["keyword_matching", "tfidf_similarity", "bert_semantic"] as const).map((key) => {
              const result = api.data!.results[key];
              const isWinner = result.match_score === Math.max(
                api.data!.results.keyword_matching.match_score,
                api.data!.results.tfidf_similarity.match_score,
                api.data!.results.bert_semantic.match_score
              );

              return (
                <Card
                  key={key}
                  className={isWinner ? "border-green-400 shadow-md" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {METHOD_LABELS[key]}
                      </CardTitle>
                      {isWinner && (
                        <Badge className="bg-green-500 text-white text-xs">
                          Best
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Score Circle */}
                    <div className="flex items-center justify-center">
                      <div className="relative h-24 w-24">
                        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none"
                            stroke="hsl(var(--muted))" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none"
                            stroke={METHOD_COLORS[key]}
                            strokeWidth="8"
                            strokeDasharray={`${result.match_score * 2.64} ${264 - result.match_score * 2.64}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold">{result.match_score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" /> Match Level
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {result.match_level}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Matched
                        </span>
                        <span className="font-medium text-green-600">
                          {result.exact_count ?? result.matched_count ?? 0}
                          {result.similar_count ? ` + ${result.similar_count} similar` : ""}
                          {result.semantic_count ? ` + ${result.semantic_count} semantic` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Missing</span>
                        <span className="font-medium text-red-500">
                          {result.missing_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Time
                        </span>
                        <span className="font-medium">
                          {result.processing_time_seconds}s
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Match Score Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, "Match Score"]} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Research Paper Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Research Paper Results Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Method</th>
                      <th className="text-center py-2 px-4">Match Score</th>
                      <th className="text-center py-2 px-4">Match Level</th>
                      <th className="text-center py-2 px-4">Matched</th>
                      <th className="text-center py-2 px-4">Missing</th>
                      <th className="text-center py-2 px-4">Time (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(["keyword_matching", "tfidf_similarity", "bert_semantic"] as const).map((key) => {
                      const r = api.data!.results[key];
                      const matched = r.exact_count ?? r.matched_count ?? 0;
                      return (
                        <tr key={key} className="border-b hover:bg-muted/50">
                          <td className="py-2 pr-4 font-medium">{METHOD_LABELS[key]}</td>
                          <td className="text-center py-2 px-4 font-bold" style={{ color: METHOD_COLORS[key] }}>
                            {r.match_score}%
                          </td>
                          <td className="text-center py-2 px-4">{r.match_level}</td>
                          <td className="text-center py-2 px-4 text-green-600">{matched}</td>
                          <td className="text-center py-2 px-4 text-red-500">{r.missing_count}</td>
                          <td className="text-center py-2 px-4">{r.processing_time_seconds}s</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Role: {api.data.role} | User Skills: {api.data.user_skill_count} | Role Skills: {api.data.role_skill_count}
              </p>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
};

export default MethodComparison;