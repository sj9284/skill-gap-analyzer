import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight } from "lucide-react";

interface RoleCount {
  role: string;
  count: number;
}

// Same category keywords as JobCategories page
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fullstack: ["full stack", "web dev", "frontend", "backend", "mern", "mean"],
  "ai-ml": ["machine learning", "artificial intelligence", "data science", "deep learning", "nlp", "ai", "ml"],
  python: ["python"],
  data: ["data analyst", "data analytics", "business analyst", "data engineer"],
  mobile: ["android", "ios", "flutter", "react native", "mobile app"],
  devops: ["devops", "cloud", "aws", "azure", "docker", "kubernetes"],
  qa: ["qa", "testing", "quality", "automation test"],
  design: ["ui", "ux", "design", "figma", "graphic"],
  other: [],
};

const RolesPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { setSelectedRole } = useAppContext();
  const api = useApi<RoleCount[]>();
  const [search, setSearch] = useState("");

  useEffect(() => {
    // ✅ Fixed: use actual backend endpoint
    api.request("/api/jobs/roles").catch(() => {});
  }, [categoryId]);

  // Filter roles by category keywords
  const categoryRoles = (api.data ?? []).filter((r) => {
    const keywords = CATEGORY_KEYWORDS[categoryId ?? ""] ?? [];
    if (keywords.length === 0) return true; // "other" shows all
    return keywords.some((k) => r.role.toLowerCase().includes(k));
  });

  const filtered = categoryRoles.filter((r) =>
    r.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
        <p className="text-muted-foreground mt-1">Select a role to view job listings</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles..."
          className="pl-10"
        />
      </div>

      {api.loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {api.error && (
        <p className="text-destructive">
          {api.error}
          <button
            onClick={() => api.request("/api/jobs/roles")}
            className="text-primary hover:underline ml-2"
          >
            Retry
          </button>
        </p>
      )}

      {api.data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((role) => (
            <Card
              key={role.role}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
              onClick={() => {
                setSelectedRole(role.role);
                navigate(`/roles/${encodeURIComponent(role.role)}/jobs`);
              }}
            >
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{role.role}</h3>
                  <p className="text-sm text-muted-foreground">{role.count} jobs</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No roles match your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RolesPage;