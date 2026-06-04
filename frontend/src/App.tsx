import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import UploadResume from "./pages/UploadResume";
import MySkills from "./pages/MySkills";
import JobCategories from "./pages/JobCategories";
import RolesPage from "./pages/RolesPage";
import JobListings from "./pages/JobListings";
import SkillGapAnalysis from "./pages/SkillGapAnalysis";
import Recommendations from "./pages/Recommendations";
import MarketInsights from "./pages/MarketInsights";
import CareerRoadmap from "./pages/CareerRoadmap";
import RoleComparison from "./pages/RoleComparison";
import MethodComparison from "./pages/MethodComparison";
import Chat from "./pages/Chat"; // ✅ New
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadResume />} />
              <Route path="/skills" element={<MySkills />} />
              <Route path="/categories" element={<JobCategories />} />
              <Route path="/categories/:categoryId/roles" element={<RolesPage />} />
              <Route path="/roles/:roleId/jobs" element={<JobListings />} />
              <Route path="/analysis" element={<SkillGapAnalysis />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/insights" element={<MarketInsights />} />
              <Route path="/roadmap" element={<CareerRoadmap />} />
              <Route path="/compare" element={<RoleComparison />} />
              <Route path="/method-comparison" element={<MethodComparison />} />
              <Route path="/chat" element={<Chat />} /> {/* ✅ New */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;