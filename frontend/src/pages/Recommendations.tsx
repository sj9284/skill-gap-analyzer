import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Recommendations = () => {
  const { analysisResult } = useAppContext();
  const navigate = useNavigate();

  if (!analysisResult) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="text-muted-foreground">Run a skill gap analysis first to get recommendations.</p>
        <Button onClick={() => navigate("/categories")}>
          Browse Job Roles <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  const high = analysisResult.recommendations.filter((r) => r.priority === "High Priority");
  const medium = analysisResult.recommendations.filter((r) => r.priority === "Medium Priority");
  const low = analysisResult.recommendations.filter((r) => r.priority === "Low Priority");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-muted-foreground mt-1">
          Skills to learn for <strong>{analysisResult.role}</strong> — sorted by market demand
        </p>
      </div>

      {[
        { label: "🔴 High Priority", items: high, variant: "destructive" as const },
        { label: "🟡 Medium Priority", items: medium, variant: "default" as const },
        { label: "🟢 Low Priority", items: low, variant: "secondary" as const },
      ].map(({ label, items, variant }) =>
        items.length > 0 ? (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((rec) => (
                  <div
                    key={rec.skill}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium text-sm">{rec.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        Required in {rec.demand_count} job postings
                      </p>
                    </div>
                    <Badge variant={variant} className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null
      )}
    </div>
  );
};

export default Recommendations;