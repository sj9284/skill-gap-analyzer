import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Code, Terminal, BrainCircuit, BarChart3,
  Megaphone, Palette, Shield, TestTube, Briefcase,
} from "lucide-react";

interface RoleCount {
  role: string;
  count: number;
}

const CATEGORIES = [
  { id: "fullstack", name: "Full Stack / Web Dev", keywords: ["full stack", "web dev", "frontend", "backend", "mern", "mean"], icon: Code },
  { id: "ai-ml", name: "AI / ML / Data", keywords: ["machine learning", "artificial intelligence", "data science", "deep learning", "nlp", "ai", "ml"], icon: BrainCircuit },
  { id: "python", name: "Python Development", keywords: ["python"], icon: Terminal },
  { id: "data", name: "Data & Analytics", keywords: ["data analyst", "data analytics", "business analyst", "data engineer"], icon: BarChart3 },
  { id: "mobile", name: "Mobile Development", keywords: ["android", "ios", "flutter", "react native", "mobile app"], icon: Palette },
  { id: "devops", name: "DevOps / Cloud", keywords: ["devops", "cloud", "aws", "azure", "docker", "kubernetes"], icon: Shield },
  { id: "qa", name: "QA / Testing", keywords: ["qa", "testing", "quality", "automation test"], icon: TestTube },
  { id: "design", name: "Design / UI-UX", keywords: ["ui", "ux", "design", "figma", "graphic"], icon: Megaphone },
  { id: "other", name: "Other Tech Roles", keywords: [], icon: Briefcase },
];

const JobCategories = () => {
  const navigate = useNavigate();
  const { setSelectedCategory } = useAppContext();
  const api = useApi<RoleCount[]>();

  useEffect(() => {
    // ✅ Fixed: use actual backend endpoint
    api.request("/api/jobs/roles").catch(() => {});
  }, []);

  const getCategoryCount = (keywords: string[], roles: RoleCount[]) => {
    if (keywords.length === 0) return roles.length;
    return roles.filter((r) =>
      keywords.some((k) => r.role.toLowerCase().includes(k))
    ).reduce((sum, r) => sum + r.count, 0);
  };

  const handleClick = (catId: string) => {
    setSelectedCategory(catId);
    navigate(`/categories/${catId}/roles`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Categories</h1>
        <p className="text-muted-foreground mt-1">Explore career domains and discover roles</p>
      </div>

      {api.loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {api.error && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-3">{api.error}</p>
            <button
              onClick={() => api.request("/api/jobs/roles")}
              className="text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {api.data && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const jobCount = getCategoryCount(cat.keywords, api.data!);
            return (
              <Card
                key={cat.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
                onClick={() => handleClick(cat.id)}
              >
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{jobCount} jobs</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobCategories;