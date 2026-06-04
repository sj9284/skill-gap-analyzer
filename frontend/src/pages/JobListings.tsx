import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building2, Clock, DollarSign, Calendar, ExternalLink, Zap } from "lucide-react";
import type { Job } from "@/types";

const JobListings = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const { setSelectedRole } = useAppContext();
  const api = useApi<Job[]>();

  useEffect(() => {
    if (roleId) {
      // ✅ Fixed: correct endpoint with decoded role name
      api.request(`/api/jobs/listings/${roleId}`).catch(() => {});
    }
  }, [roleId]);

  const handleAnalyze = (job: Job) => {
    setSelectedRole(job.role);
    navigate("/analysis");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
        <p className="text-muted-foreground mt-1">
          Browse and analyze job opportunities for <strong>{decodeURIComponent(roleId ?? "")}</strong>
        </p>
      </div>

      {api.loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      )}

      {api.error && (
        <p className="text-destructive">
          {api.error}
          <button
            onClick={() => api.request(`/api/jobs/listings/${roleId}`)}
            className="text-primary hover:underline ml-2"
          >
            Retry
          </button>
        </p>
      )}

      {api.data && (
        <div className="space-y-4">
          {api.data.map((job, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl">{job.role}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />{job.company}
                    </div>
                  </div>
                  <Badge variant="outline" className="self-start">{job.job_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4" />{job.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />{job.experience}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />{job.salary}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />{job.posted_date}
                  </div>
                </div>

                {job.duration && job.duration !== "N/A" && (
                  <p className="text-sm text-muted-foreground">Duration: {job.duration}</p>
                )}

                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                {/* ✅ Fixed: use skills_list instead of skills */}
                <div className="flex flex-wrap gap-1.5">
                  {(job.skills_list ?? []).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => handleAnalyze(job)}>
                    <Zap className="mr-1 h-4 w-4" /> Analyze Match
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                      Apply Now <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {api.data.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No jobs found for this role.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobListings;