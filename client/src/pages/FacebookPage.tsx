import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Facebook as FacebookIcon, 
  Link2, 
  Users, 
  Eye, 
  ThumbsUp, 
  Heart,
  MessageCircle,
  Play,
  TrendingUp,
  RefreshCw,
  UserPlus,
  Share2
} from "lucide-react";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectFacebook from "@/components/projects/ConnectFacebook";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import type { DateRange, Project, FacebookOverviewMetrics } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const FacebookPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<FacebookOverviewMetrics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>(buildDateRange("last28days"));

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingProject(true);
      const { data } = await api.get<{ success: boolean; data: Project }>(`/projects/${projectId}`);
      if (data.success) {
        setProject(data.data);
      }
    } catch (err: any) {
      setProjectError(err.response?.data?.error || "Failed to load project");
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  const fetchFacebookData = useCallback(async () => {
    if (!projectId || !project?.facebookPageId) return;

    const params = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };

    setLoadingData(true);
    setDataError(null);

    try {
      const { data } = await api.get<{ success: boolean; data: FacebookOverviewMetrics }>(
        `/facebook/overview/${projectId}`,
        { params }
      );
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err: any) {
      setDataError(err.response?.data?.error || "Failed to load Facebook insights");
    } finally {
      setLoadingData(false);
    }
  }, [projectId, project?.facebookPageId, dateRange]);

  useEffect(() => {
    void fetchFacebookData();
  }, [fetchFacebookData]);

  const handleDateRangeChange = (preset: DateRangePreset) => {
    setDateRange(buildDateRange(preset));
  };

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    if (projectId) {
      api.get<{ success: boolean; data: Project }>(`/projects/${projectId}`).then(({ data }) => {
        if (data.success) {
          setProject(data.data);
        }
      });
    }
  };

  if (loadingProject) {
    return <LoadingState message="Loading project..." className="py-16" />;
  }

  if (projectError || !project) {
    return <ErrorState description={projectError || "Project not found"} className="py-16" />;
  }

  if (!project.facebookPageId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Facebook Insights</h1>
          <p className="text-sm text-slate-500">Connect your page to view performance data</p>
        </div>
        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FacebookIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Facebook Page</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your page to view engagement metrics, reach, and audience insights.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Facebook
            </Button>
          </CardContent>
        </Card>
        {showConnectModal && projectId && (
          <ConnectFacebook
            projectId={projectId}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  return (
    <motion.section 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25">
            <FacebookIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Facebook Insights</h1>
            <p className="text-sm text-slate-500">Page performance for {project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
          <Button variant="outline" onClick={fetchFacebookData} disabled={loadingData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {loadingData && !overview ? (
        <LoadingState message="Loading insights..." />
      ) : dataError ? (
        <ErrorState description={dataError} onRetry={fetchFacebookData} />
      ) : overview ? (
        <>
          {/* Main Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Impressions</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(overview.pageImpressions)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Eye className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-100 text-sm font-medium">Reach</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(overview.pageReach)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-violet-100 text-sm font-medium">Engaged Users</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(overview.pageEngagedUsers)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Heart className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Post Engagements</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(overview.pagePostEngagements)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Page Likes</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(overview.pageLikes)}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <ThumbsUp className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Followers</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(overview.pageFollowers)}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <UserPlus className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Video Views</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(overview.pageVideoViews)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-xl">
                      <Play className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Page Info */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Page Information</CardTitle>
              <CardDescription className="text-slate-500">Connected Facebook page details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FacebookIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Page ID</p>
                      <p className="font-mono text-sm text-slate-900">{project.facebookPageId}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-end">
                  <Button variant="outline" onClick={() => setShowConnectModal(true)}>
                    Change Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState title="No data available" description="Unable to load Facebook insights data." />
      )}

      {showConnectModal && (
        <ConnectFacebook
          projectId={projectId!}
          onSuccess={handleConnectSuccess}
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </motion.section>
  );
};

export default FacebookPage;
