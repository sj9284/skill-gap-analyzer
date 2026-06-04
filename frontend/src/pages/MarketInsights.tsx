import { useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";
import type { MarketInsight } from "@/types";

const CHART_COLORS = [
  "hsl(230, 75%, 57%)", "hsl(152, 60%, 42%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(210, 100%, 52%)", "hsl(280, 65%, 55%)",
  "hsl(190, 70%, 45%)", "hsl(340, 75%, 55%)", "hsl(60, 70%, 45%)",
];

const MarketInsights = () => {
  const api = useApi<MarketInsight>();

  useEffect(() => {
    // ✅ Fixed: correct endpoint
    api.request("/api/analysis/insights").catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Insights</h1>
        <p className="text-muted-foreground mt-1">Real-time job market trends and analytics</p>
      </div>

      {api.loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      )}

      {api.error && <p className="text-destructive">{api.error}</p>}

      {api.data && (
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Top Skills Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Top Skills by Demand</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={api.data.top_skills}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {/* ✅ Fixed: use skill instead of name */}
                  <XAxis dataKey="skill" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(230, 75%, 57%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Roles Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Hiring Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {/* ✅ Fixed: use role instead of name */}
                <BarChart data={api.data.top_roles} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="role" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(152, 60%, 42%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Job Type Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Internship vs Full-time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={api.data.job_type_breakdown.breakdown}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ type, percentage }) => `${type} ${percentage}%`}
                  >
                    {api.data.job_type_breakdown.breakdown.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Salary Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Salary Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Average Salary", value: `₹${api.data.salary_insights.average.toLocaleString()}` },
                { label: "Minimum Salary", value: `₹${api.data.salary_insights.min.toLocaleString()}` },
                { label: "Maximum Salary", value: `₹${api.data.salary_insights.max.toLocaleString()}` },
                { label: "Sample Size", value: `${api.data.salary_insights.sample_count} data points` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skills by Job Type */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Top Skills — Internship vs Full-time</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {(["Internship", "Full-time"] as const).map((type) => (
                <div key={type}>
                  <h3 className="font-semibold mb-3">{type}</h3>
                  <div className="space-y-2">
                    {api.data!.skills_by_job_type[type].map(({ skill, count }) => (
                      <div key={skill} className="flex justify-between text-sm">
                        <span>{skill}</span>
                        <span className="text-muted-foreground">{count} jobs</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
};

export default MarketInsights;