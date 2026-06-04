import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, Sparkles } from "lucide-react";

const MySkills = () => {
  const { skills, addSkill, removeSkill } = useAppContext();
  const [input, setInput] = useState("");
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const suggestionsApi = useApi<string[]>();

  useEffect(() => {
    suggestionsApi.request("/api/skill-suggestions").catch(() => {});
  }, []);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && addSkill(trimmed)) {
      setRecentlyAdded((prev) => [...prev, trimmed]);
      setInput("");
      setTimeout(() => setRecentlyAdded((prev) => prev.filter((s) => s !== trimmed)), 3000);
    }
  };

  const filteredSuggestions = (suggestionsApi.data ?? []).filter(
    (s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase()) &&
           s.toLowerCase().includes(input.toLowerCase()) &&
           input.length > 0
  ).slice(0, 6);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">My Skills</h1>
        <p className="text-muted-foreground mt-1">Manage your skill set for accurate job matching</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Add a Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Type a skill name..."
              />
              {filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { addSkill(s); setInput(""); setRecentlyAdded((p) => [...p, s]); setTimeout(() => setRecentlyAdded((p) => p.filter((x) => x !== s)), 3000); }}
                    >
                      <Sparkles className="inline h-3 w-3 mr-2 text-primary" />{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Your Skills ({skills.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No skills added yet. Upload a resume or add skills manually.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant={recentlyAdded.includes(skill) ? "default" : "secondary"}
                  className={`text-sm py-1.5 px-3 gap-1 transition-all ${recentlyAdded.includes(skill) ? "ring-2 ring-primary/30" : ""}`}
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySkills;
