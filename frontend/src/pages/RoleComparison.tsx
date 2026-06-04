import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleCount { role: string; count: number; }
interface CompareResult {
  comparison: {
    role: string;
    match_score: number;
    match_level: string;
    matched_count: number;
    missing_count: number;
  }[];
}

const RoleComparison = () => {
  const { skills } = useAppContext();
  const [role1, setRole1] = useState("");
  const [role2, setRole2] = useState("");
  const rolesApi = useApi<RoleCount[]>();
  const compareApi = useApi<CompareResult>();

  useEffect(() => {
    // ✅ Fixed: correct endpoint
    rolesApi.request("/api/jobs/roles").catch(() => {});
  }, []);

  useEffect(() => {
    if (role1 && role2 && role1 !== role2 && skills.length > 0) {
      // ✅ Fixed: correct endpoint + correct payload
      compareApi.request("/api/analysis/compare-roles", {
        method: "POST",
        body: JSON.stringify({ skills, roles: [role1, role2] }),
      }).catch(() => {});
    }
  }, [role1, role2, skills]);

  const roles = rolesApi.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Comparison</h1>
        <p className="text-muted-foreground mt-1">Compare skill requirements between two roles</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-2 block">Role 1</label>
          {rolesApi.loading ? <Skeleton className="h-10" /> : (
            <Select value={role1} onValueChange={setRole1}>
              <SelectTrigger><SelectValue placeholder="Select first role" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Role 2</label>
          {rolesApi.loading ? <Skeleton className="h-10" /> : (
            <Select value={role2} onValueChange={setRole2}>
              <SelectTrigger><SelectValue placeholder="Select second role" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {skills.length === 0 && (
        <p className="text-amber-600 text-sm">⚠️ Upload your resume or add skills first to compare roles.</p>
      )}

      {compareApi.loading && <Skeleton className="h-64 rounded-xl" />}
      {compareApi.error && <p className="text-destructive">{compareApi.error}</p>}

      {compareApi.data && (
        <div className="grid gap-5 sm:grid-cols-2">
          {compareApi.data.comparison.map((r) => (
            <Card key={r.role}>
              <CardHeader>
                <CardTitle className="text-base">{r.role}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Match Score</span>
                  <span className="text-2xl font-bold">{r.match_score}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Match Level</span>
                  <Badge variant={r.match_score >= 50 ? "default" : "secondary"}>{r.match_level}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Skills Matched</span>
                  <span className="font-medium text-green-600">{r.matched_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Skills Missing</span>
                  <span className="font-medium text-red-500">{r.missing_count}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(!role1 || !role2) && (
        <p className="text-muted-foreground text-center py-12">
          Select two roles above to compare their skill requirements.
        </p>
      )}
    </div>
  );
};

export default RoleComparison;