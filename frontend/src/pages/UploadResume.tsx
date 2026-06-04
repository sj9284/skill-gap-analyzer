import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useFileUpload } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, ArrowRight } from "lucide-react";

const UploadResume = () => {
  const navigate = useNavigate();
  const { setSkills, setResumeUploaded } = useAppContext();
  // ✅ Fixed: backend returns { skills, skill_count, filename }
  const { data, loading, error, progress, upload } = useFileUpload<{
    skills: string[];
    skill_count: number;
    filename: string;
  }>();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback((file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file.");
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      // ✅ Fixed: correct endpoint /api/resume/upload
      const result = await upload("/api/resume/upload", selectedFile);
      if (result?.skills) {
        setSkills(result.skills);
        setResumeUploaded(true);
      }
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Resume</h1>
        <p className="text-muted-foreground mt-1">
          Upload your resume to extract skills automatically
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drag & drop your resume here</p>
            <p className="text-sm text-muted-foreground mt-1">Supports PDF and DOCX files</p>
          </div>

          {selectedFile && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium flex-1 truncate">{selectedFile.name}</span>
              {!data && (
                <Button onClick={handleUpload} disabled={loading}>
                  {loading ? "Uploading..." : "Upload"}
                </Button>
              )}
            </div>
          )}

          {loading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Extracting skills...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      {data?.skills && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {data.skill_count} Skills Extracted from {data.filename}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
            <Button
              onClick={() => navigate("/skills")}
              className="mt-6 w-full"
              size="lg"
            >
              Proceed to My Skills <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadResume;