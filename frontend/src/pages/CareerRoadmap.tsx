import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CareerRoadmap = () => {
  const { analysisResult, skills } = useAppContext();
  const navigate = useNavigate();

  if (!analysisResult) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-3xl font-bold">Career Roadmap</h1>
        <p className="text-muted-foreground">Run a skill gap analysis first to generate your roadmap.</p>
        <Button onClick={() => navigate("/categories")}>
          Browse Job Roles <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Build roadmap from analysis result
  const highPriority = analysisResult.recommendations
    .filter((r) => r.priority === "High Priority")
    .map((r) => r.skill);

  const mediumPriority = analysisResult.recommendations
    .filter((r) => r.priority === "Medium Priority")
    .map((r) => r.skill);

  const lowPriority = analysisResult.recommendations
    .filter((r) => r.priority === "Low Priority")
    .slice(0, 6)
    .map((r) => r.skill);

  const stages = [
    {
      id: "current",
      title: "Current Skills",
      description: "Skills you already have that are relevant to this role.",
      skills: analysisResult.matched_skills,
      duration: "Now",
      completed: true,
    },
    {
      id: "high",
      title: "High Priority Skills",
      description: "Most in-demand skills missing from your profile. Learn these first.",
      skills: highPriority,
      duration: "1-2 months",
      completed: false,
    },
    {
      id: "medium",
      title: "Medium Priority Skills",
      description: "Important skills that will significantly improve your match score.",
      skills: mediumPriority,
      duration: "2-3 months",
      completed: false,
    },
    {
      id: "low",
      title: "Nice-to-Have Skills",
      description: "Additional skills that will make you a stronger candidate.",
      skills: lowPriority,
      duration: "3-6 months",
      completed: false,
    },
  ].filter((s) => s.skills.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Career Roadmap</h1>
        <p className="text-muted-foreground mt-1">
          Your personalized learning path for <strong>{analysisResult.role}</strong>
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-6">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="relative flex gap-4">
              <div className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 shrink-0 ${
                stage.completed
                  ? "bg-green-500 border-green-500"
                  : "bg-card border-border"
              }`}>
                {stage.completed
                  ? <CheckCircle className="h-5 w-5 text-white" />
                  : <Circle className="h-5 w-5 text-muted-foreground" />
                }
              </div>
              <Card className="flex-1">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Stage {idx + 1}: {stage.title}</h3>
                    <Badge variant="outline" className="text-xs">{stage.duration}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stage.skills.map((s) => (
                      <Badge key={s} variant={stage.completed ? "default" : "secondary"} className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerRoadmap;