import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Link2, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Target, 
  Percent, 
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  Instagram,
  Facebook as FacebookIcon
} from "lucide-react";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectMetaAds from "@/components/projects/ConnectMetaAds";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import type { DateRange, Project, MetaAdsInsights } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const MetaAdsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [insights, setInsights] = useState<MetaAdsInsights | null>(null);
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

  const fetchMetaAdsData = useCallback(async () => {
    if (!projectId || !project?.metaAdsAccountId) return;

    const params = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };

    setLoadingData(true);
    setDataError(null);

    try {
      const { data } = await api.get<{ success: boolean; data: MetaAdsInsights }>(
        `/meta-ads/insights/${projectId}`,
        { params }
      );
      if (data.success) {
        setInsights(data.data);
      }
    } catch (err: any) {
      setDataError(err.response?.data?.error || "Failed to load Meta Ads insights");
    } finally {
      setLoadingData(false);
    }
  }, [projectId, project?.metaAdsAccountId, dateRange]);

  useEffect(() => {
    void fetchMetaAdsData();
  }, [fetchMetaAdsData]);

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

  if (!project.metaAdsAccountId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meta Ads</h1>
          <p className="text-sm text-slate-500">Connect your advertising account</p>
        </div>
        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl">
                <div className="flex items-center gap-1">
                  <FacebookIcon className="h-5 w-5 text-blue-600" />
                  <Instagram className="h-5 w-5 text-pink-600" />
                </div>
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Meta Ads</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your account to view Facebook & Instagram ad performance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Meta Ads
            </Button>
          </CardContent>
        </Card>
        {showConnectModal && projectId && (
          <ConnectMetaAds
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
          <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25">
            <div className="flex items-center gap-1">
              <FacebookIcon className="h-5 w-5 text-white" />
              <Instagram className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Meta Ads Insights</h1>
            <p className="text-sm text-slate-500">
              Account ID: {project.metaAdsAccountId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
          <Button variant="outline" onClick={fetchMetaAdsData} disabled={loadingData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {loadingData && !insights ? (
        <LoadingState message="Loading ad insights..." />
      ) : dataError ? (
        <ErrorState description={dataError} onRetry={fetchMetaAdsData} />
      ) : insights ? (
        <>
          {/* Primary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Impressions</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(insights.impressions)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Eye className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Clicks</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(insights.clicks)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <MousePointer className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Spend</p>
                      <p className="text-3xl font-bold mt-1">{formatCurrency(insights.spend)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm font-medium">Reach</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(insights.reach)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Actions</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights.actions)}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Zap className="h-5 w-5 text-purple-600" />
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
                      <p className="text-slate-500 text-sm font-medium">CTR</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{insights.ctr.toFixed(2)}%</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Percent className="h-5 w-5 text-blue-600" />
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
                      <p className="text-slate-500 text-sm font-medium">CPC</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(insights.cpc)}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">CPM</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(insights.cpm)}</p>
                    </div>
                    <div className="p-3 bg-pink-100 rounded-xl">
                      <DollarSign className="h-5 w-5 text-pink-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Conversion Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium">Conversions</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(insights.conversions)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Target className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Conversion Rate</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{insights.conversionRate.toFixed(2)}%</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Cost per Conversion</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(insights.costPerConversion)}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Account Info */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Account Information</CardTitle>
              <CardDescription className="text-slate-500">Connected Meta Ads account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                      <div className="flex items-center">
                        <FacebookIcon className="h-4 w-4 text-blue-600" />
                        <Instagram className="h-4 w-4 text-pink-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Account ID</p>
                      <p className="font-mono text-sm text-slate-900">{project.metaAdsAccountId}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-end">
                  <Button variant="outline" onClick={() => setShowConnectModal(true)}>
                    Change Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState title="No data available" description="Unable to load Meta Ads insights data." />
      )}

      {showConnectModal && (
        <ConnectMetaAds
          projectId={projectId!}
          onSuccess={handleConnectSuccess}
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </motion.section>
  );
};

export default MetaAdsPage;
