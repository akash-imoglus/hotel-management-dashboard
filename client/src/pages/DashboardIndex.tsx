import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutDashboard, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import api from "@/lib/api";
import type { Project } from "@/types";

const DashboardIndex = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: Project[] }>("/projects");
      // Backend returns { success: true, data: projects[] }
      const projects = response.data.data || response.data;
      setProjects(Array.isArray(projects) ? projects : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  if (loading) {
    return <LoadingState message="Fetching your projects..." className="py-16" />;
  }

  if (error) {
    return (
      <ErrorState
        description={error}
        onRetry={fetchProjects}
        className="py-16"
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <LayoutDashboard className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Your Dashboard</h1>
          <p className="text-slate-600 mb-8">
            Get started by creating your first project to track analytics and insights.
          </p>
          <Button onClick={() => navigate("/projects/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-slate-600">
          Select a project from the dropdown to view its analytics and insights.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const projectId = project.id ?? project._id;
          if (!projectId) return null;

          const connectedCount = [
            project.gaPropertyId,
            project.googleAdsCustomerId,
            project.searchConsoleSiteUrl,
            project.facebookPageId,
            project.metaAdsAccountId,
            project.instagram?.igUserId,
            project.youtubeChannelId,
            project.linkedinPageId,
            project.googleBusinessProfileLocationId,
          ].filter(Boolean).length;

          return (
            <div
              key={projectId}
              onClick={() => navigate(`/dashboard/${projectId}`)}
              className="bg-white rounded-lg border border-slate-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{project.name}</h3>
              <p className="text-sm text-slate-600 mb-4 truncate">{project.websiteUrl}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <BarChart3 className="h-4 w-4" />
                  <span>{connectedCount} connected</span>
                </div>
                <Button variant="ghost" size="sm">
                  View Dashboard →
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => navigate("/projects/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Project
        </Button>
      </div>
    </div>
  );
};

export default DashboardIndex;

