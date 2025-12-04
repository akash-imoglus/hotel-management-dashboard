import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  Wallet,
  Target,
  Search,
  Globe,
  Heart,
  BarChart3,
  ExternalLink,
  Zap,
  Award,
  Activity,
  Clock,
  Percent,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import MetricLoader from "@/components/common/MetricLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MagicSuggestionModal from "@/components/dashboard/MagicSuggestionModal";
import api from "@/lib/api";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import type { Project } from "@/types";

// Types for aggregated data
interface AggregatedMetrics {
  website: {
    users: number;
    sessions: number;
    pageviews: number;
    bounceRate: number;
    avgSessionDuration: number;
    newUsers: number;
  } | null;
  advertising: {
    totalSpend: number;
    totalClicks: number;
    totalImpressions: number;
    totalConversions: number;
    avgCpc: number;
    avgCtr: number;
  } | null;
  social: {
    totalFollowers: number;
    totalEngagement: number;
    totalReach: number;
    platforms: { name: string; followers: number; engagement: number }[];
  } | null;
  seo: {
    clicks: number;
    impressions: number;
    avgPosition: number;
    ctr: number;
  } | null;
}

// Chart colors
const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const DashboardOverviewPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metrics, setMetrics] = useState<AggregatedMetrics>({
    website: null,
    advertising: null,
    social: null,
    seo: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showMagicSuggestions, setShowMagicSuggestions] = useState(false);

  // Date range for the last 7 days
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingProject(true);
      const response = await api.get<{ success: boolean; data: Project }>(`/projects/${projectId}`);
      const project = response.data.data || response.data;
      setProject(project as Project);
      setProjectError(null);
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : "Project not found.");
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  const fetchAllMetrics = useCallback(async () => {
    if (!projectId || !project) return;

    setLoadingMetrics(true);
    const { startDate, endDate } = getDateRange();
    const newMetrics: AggregatedMetrics = {
      website: null,
      advertising: null,
      social: null,
      seo: null,
    };

    // Fetch Google Analytics data
    if (project.gaPropertyId) {
      try {
        const { data } = await api.get(`/analytics/overview/${projectId}`, {
          params: { startDate, endDate },
        });
        if (data.success && data.data) {
          newMetrics.website = {
            users: data.data.totalUsers || 0,
            sessions: data.data.sessions || 0,
            pageviews: data.data.pageviews || 0,
            bounceRate: data.data.bounceRate || 0,
            avgSessionDuration: data.data.averageSessionDuration || 0,
            newUsers: data.data.newUsers || 0,
          };
        }
      } catch (error) {
        console.log("[Overview] Failed to fetch GA data:", error);
      }
    }

    // Fetch advertising data (Google Ads + Meta Ads)
    let totalAdSpend = 0;
    let totalAdClicks = 0;
    let totalAdImpressions = 0;
    let totalAdConversions = 0;
    let hasAdData = false;

    if (project.googleAdsCustomerId) {
      try {
        const { data } = await api.get(`/google-ads/${projectId}/overview`, {
          params: { startDate, endDate },
        });
        if (data.success && data.data) {
          totalAdSpend += data.data.cost || 0;
          totalAdClicks += data.data.clicks || 0;
          totalAdImpressions += data.data.impressions || 0;
          totalAdConversions += data.data.conversions || 0;
          hasAdData = true;
        }
      } catch (error) {
        console.log("[Overview] Failed to fetch Google Ads data:", error);
      }
    }

    if (project.metaAdsAccountId) {
      try {
        const { data } = await api.get(`/meta-ads/insights/${projectId}`, {
          params: { startDate, endDate },
        });
        if (data.success && data.data) {
          totalAdSpend += parseFloat(data.data.spend) || 0;
          totalAdClicks += parseInt(data.data.clicks) || 0;
          totalAdImpressions += parseInt(data.data.impressions) || 0;
          totalAdConversions += parseInt(data.data.conversions) || 0;
          hasAdData = true;
        }
      } catch (error) {
        console.log("[Overview] Failed to fetch Meta Ads data:", error);
      }
    }

    if (hasAdData) {
      newMetrics.advertising = {
        totalSpend: totalAdSpend,
        totalClicks: totalAdClicks,
        totalImpressions: totalAdImpressions,
        totalConversions: totalAdConversions,
        avgCpc: totalAdClicks > 0 ? totalAdSpend / totalAdClicks : 0,
        avgCtr: totalAdImpressions > 0 ? (totalAdClicks / totalAdImpressions) * 100 : 0,
      };
    }

    // Fetch social media data
    const socialPlatforms: { name: string; followers: number; engagement: number }[] = [];
    let totalFollowers = 0;
    let totalEngagement = 0;
    let totalReach = 0;

    if (project.facebookPageId) {
      try {
        const { data } = await api.get(`/facebook/overview/${projectId}`, {
          params: { startDate, endDate },
        });
        if (data.success && data.data) {
          const fbFollowers = data.data.pageFollowers || data.data.pageLikes || 0;
          const fbEngagement = data.data.pagePostEngagements || data.data.pageEngagedUsers || 0;
          totalFollowers += fbFollowers;
          totalEngagement += fbEngagement;
          totalReach += data.data.pageImpressions || data.data.pageReach || 0;
          socialPlatforms.push({ name: "Facebook", followers: fbFollowers, engagement: fbEngagement });
        }
      } catch (error) {
        console.log("[Overview] Failed to fetch Facebook data:", error);
      }
    }

    if (project.instagram?.igUserId) {
      try {
        const { data } = await api.get(`/instagram/insights/${projectId}`);
        if (data.success && data.data) {
          const igFollowers = data.data.lifetime?.follower_count || data.data.days_28?.follower_count || 0;
          const igEngagement = data.data.lifetime?.total_interactions || data.data.days_28?.total_interactions || 0;
          totalFollowers += igFollowers;
          totalEngagement += igEngagement;
          totalReach += data.data.days_28?.reach || data.data.lifetime?.reach || 0;
          socialPlatforms.push({ name: "Instagram", followers: igFollowers, engagement: igEngagement });
        }
      } catch (error) {
        console.log("[Overview] Failed to fetch Instagram data:", error);
      }
    }

    if (socialPlatforms.length > 0) {
      newMetrics.social = {
        totalFollowers,
        totalEngagement,
        totalReach,
        platforms: socialPlatforms,
      };
    }

    // Fetch SEO data from Search Console
    if (project.searchConsoleSiteUrl) {
      try {
        const { data } = await api.get(`/gsc/${projectId}/overview`, {
          params: { startDate, endDate },
        });
        if (data.success && data.data) {
          newMetrics.seo = {
            clicks: data.data.clicks || 0,
            impressions: data.data.impressions || 0,
            avgPosition: data.data.position || 0,
            ctr: data.data.ctr || 0,
          };
        }
      } catch (error) {
        console.log("[Overview] Failed to fetch GSC data:", error);
      }
    }

    setMetrics(newMetrics);
    setLastUpdated(new Date());
    setLoadingMetrics(false);
  }, [projectId, project]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project) {
      void fetchAllMetrics();
    }
  }, [project, fetchAllMetrics]);

  const handleRefresh = () => {
    void fetchAllMetrics();
  };

  if (!projectId) {
    return (
      <EmptyState
        title="No project selected"
        description="Choose a project from your list to view dashboard."
      />
    );
  }

  if (loadingProject) {
    return <LoadingState message="Loading project..." className="py-16" />;
  }

  if (projectError) {
    return <ErrorState description={projectError} onRetry={fetchProject} className="py-16" />;
  }

  const hasGA = !!project?.gaPropertyId;
  const hasAds = !!project?.googleAdsCustomerId;
  const hasMetaAds = !!project?.metaAdsAccountId;
  const hasSearchConsole = !!project?.searchConsoleSiteUrl;
  const hasFacebook = !!project?.facebookPageId;
  const hasInstagram = !!project?.instagram?.igUserId;
  const hasYouTube = !!project?.youtubeChannelId;
  const hasLinkedIn = !!project?.linkedinPageId;
  const hasGBP = !!project?.googleBusinessProfileLocationId;

  const connectedCount = [hasGA, hasAds, hasMetaAds, hasSearchConsole, hasFacebook, hasInstagram, hasYouTube, hasLinkedIn, hasGBP].filter(Boolean).length;
  const totalPlatforms = 9;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatCurrency = (num: number) => {
    // Get currency from Google Ads or Meta Ads, fallback to INR
    const currency = project?.googleAdsCurrency || project?.metaAdsCurrency || 'INR';
    return formatCurrencyUtil(num, currency);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Prepare chart data for social platforms
  const socialChartData = metrics.social?.platforms.map((p, i) => ({
    name: p.name,
    value: p.followers,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

  return (
    <motion.section
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a
              href={project?.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {project?.websiteUrl?.replace(/^https?:\/\//, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{project?.name ?? "Project"}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Executive Dashboard • Last 7 Days
            {lastUpdated && (
              <span className="ml-2 text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-slate-500">Connected Platforms</p>
            <p className="text-2xl font-bold text-slate-900">
              {connectedCount}/{totalPlatforms}
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowMagicSuggestions(true)}
            className="gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 border-0"
          >
            <Sparkles className="h-4 w-4" />
            Magic Suggestions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loadingMetrics}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingMetrics ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics Row - Executive Summary */}
      <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Website Visitors */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl shadow-blue-500/30">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-50">Website Visitors</span>
            </div>
            {loadingMetrics && !metrics.website ? (
              <MetricLoader className="py-4" />
            ) : metrics.website ? (
              <>
                <div className="text-4xl font-bold mb-1">
                  {formatNumber(metrics.website.users)}
                </div>
                <p className="text-sm text-blue-100 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {formatNumber(metrics.website.newUsers)} new visitors
                </p>
              </>
            ) : hasGA ? (
              <div className="text-2xl font-semibold text-blue-100">—</div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-blue-100 mb-1">—</div>
                <p className="text-xs text-blue-200">Connect Google Analytics</p>
              </>
            )}
          </div>
        </div>

        {/* Ad Spend */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl shadow-emerald-500/30">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-emerald-50">Ad Spend</span>
            </div>
            {loadingMetrics && !metrics.advertising ? (
              <MetricLoader className="py-4" />
            ) : metrics.advertising ? (
              <>
                <div className="text-4xl font-bold mb-1">
                  {formatCurrency(metrics.advertising.totalSpend)}
                </div>
                <p className="text-sm text-emerald-100 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  {formatNumber(metrics.advertising.totalConversions)} conversions
                </p>
              </>
            ) : (hasAds || hasMetaAds) ? (
              <div className="text-2xl font-semibold text-emerald-100">—</div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-emerald-100 mb-1">—</div>
                <p className="text-xs text-emerald-200">Connect Ads platforms</p>
              </>
            )}
          </div>
        </div>

        {/* Social Followers */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-xl shadow-pink-500/30">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-pink-50">Social Followers</span>
            </div>
            {loadingMetrics && !metrics.social ? (
              <MetricLoader className="py-4" />
            ) : metrics.social ? (
              <>
                <div className="text-4xl font-bold mb-1">
                  {formatNumber(metrics.social.totalFollowers)}
                </div>
                <p className="text-sm text-pink-100 flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {formatNumber(metrics.social.totalEngagement)} engagements
                </p>
              </>
            ) : (hasFacebook || hasInstagram) ? (
              <div className="text-2xl font-semibold text-pink-100">—</div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-pink-100 mb-1">—</div>
                <p className="text-xs text-pink-200">Connect social platforms</p>
              </>
            )}
          </div>
        </div>

        {/* Search Visibility */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl shadow-purple-500/30">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-50">Search Clicks</span>
            </div>
            {loadingMetrics && !metrics.seo ? (
              <MetricLoader className="py-4" />
            ) : metrics.seo ? (
              <>
                <div className="text-4xl font-bold mb-1">
                  {formatNumber(metrics.seo.clicks)}
                </div>
                <p className="text-sm text-purple-100 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Position #{metrics.seo.avgPosition.toFixed(1)}
                </p>
              </>
            ) : hasSearchConsole ? (
              <div className="text-2xl font-semibold text-purple-100">—</div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-purple-100 mb-1">—</div>
                <p className="text-xs text-purple-200">Connect Search Console</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Website Performance Section */}
      {(hasGA || metrics.website) && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Website Performance</CardTitle>
                    <CardDescription>Google Analytics insights</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/dashboard/${projectId}/analytics`)}
                  className="gap-1"
                >
                  View Details <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingMetrics && !metrics.website ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MetricLoader />
                  <p className="text-sm text-slate-500 mt-4">Loading website data...</p>
                </div>
              ) : metrics.website ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm"
                  >
                    <Users className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(metrics.website.users)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Total Users</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm"
                  >
                    <Activity className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(metrics.website.sessions)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Sessions</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm"
                  >
                    <Eye className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(metrics.website.pageviews)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Pageviews</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm"
                  >
                    <Percent className="h-5 w-5 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{metrics.website.bounceRate.toFixed(1)}%</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Bounce Rate</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200 shadow-sm"
                  >
                    <Clock className="h-5 w-5 text-pink-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{formatDuration(metrics.website.avgSessionDuration)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Avg. Duration</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm"
                  >
                    <Zap className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(metrics.website.newUsers)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">New Users</p>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Connect Google Analytics to see website performance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Two Column Layout for Ads and Social */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Advertising Performance */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advertising</CardTitle>
                  <CardDescription>Google Ads + Meta Ads</CardDescription>
                </div>
              </div>
              {(hasAds || hasMetaAds) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/dashboard/${projectId}/${hasAds ? "ads" : "meta-ads"}`)}
                  className="gap-1"
                >
                  View <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingMetrics && !metrics.advertising ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MetricLoader />
                <p className="text-sm text-slate-500 mt-4">Loading advertising data...</p>
              </div>
            ) : metrics.advertising ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs text-emerald-700 font-semibold">Total Spend</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(metrics.advertising.totalSpend)}</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-blue-700 font-semibold">Conversions</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{formatNumber(metrics.advertising.totalConversions)}</p>
                  </motion.div>
                </div>
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-center">
                    <MousePointer className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                    <p className="text-xl font-semibold text-slate-900">{formatNumber(metrics.advertising.totalClicks)}</p>
                    <p className="text-xs text-slate-600 font-medium">Clicks</p>
                  </div>
                  <div className="text-center">
                    <CreditCard className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                    <p className="text-xl font-semibold text-slate-900">{formatCurrency(metrics.advertising.avgCpc)}</p>
                    <p className="text-xs text-slate-600 font-medium">Avg. CPC</p>
                  </div>
                  <div className="text-center">
                    <Percent className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                    <p className="text-xl font-semibold text-slate-900">{metrics.advertising.avgCtr.toFixed(2)}%</p>
                    <p className="text-xs text-slate-600 font-medium">CTR</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-3">Connect advertising platforms to track campaigns</p>
                <div className="flex justify-center gap-2">
                  {!hasAds && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/${projectId}/ads`)}>
                      Connect Google Ads
                    </Button>
                  )}
                  {!hasMetaAds && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/${projectId}/meta-ads`)}>
                      Connect Meta Ads
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Performance */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Social Media</CardTitle>
                  <CardDescription>Facebook + Instagram</CardDescription>
                </div>
              </div>
              {(hasFacebook || hasInstagram) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/dashboard/${projectId}/${hasFacebook ? "facebook" : "instagram"}`)}
                  className="gap-1"
                >
                  View <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingMetrics && !metrics.social ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MetricLoader />
                <p className="text-sm text-slate-500 mt-4">Loading social media data...</p>
              </div>
            ) : metrics.social ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  {socialChartData.length > 0 && (
                    <div className="flex-shrink-0">
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie
                            data={socialChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {socialChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    {metrics.social.platforms.map((platform, index) => (
                      <div key={platform.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-slate-700">{platform.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatNumber(platform.followers)} followers
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{formatNumber(metrics.social.totalEngagement)}</p>
                    <p className="text-xs text-slate-500">Total Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{formatNumber(metrics.social.totalReach)}</p>
                    <p className="text-xs text-slate-500">Total Reach</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-3">Connect social platforms to track engagement</p>
                <div className="flex justify-center gap-2">
                  {!hasFacebook && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/${projectId}/facebook`)}>
                      Connect Facebook
                    </Button>
                  )}
                  {!hasInstagram && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/${projectId}/instagram`)}>
                      Connect Instagram
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* SEO Performance */}
      {(hasSearchConsole || metrics.seo) && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Search className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Search Performance</CardTitle>
                    <CardDescription>Google Search Console insights</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/dashboard/${projectId}/search-console`)}
                  className="gap-1"
                >
                  View Details <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingMetrics && !metrics.seo ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MetricLoader />
                  <p className="text-sm text-slate-500 mt-4">Loading SEO data...</p>
                </div>
              ) : metrics.seo ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm"
                  >
                    <MousePointer className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(metrics.seo.clicks)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Total Clicks</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm"
                  >
                    <Eye className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(metrics.seo.impressions)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Impressions</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border border-violet-200 shadow-sm"
                  >
                    <Percent className="h-5 w-5 text-violet-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{(metrics.seo.ctr * 100).toFixed(1)}%</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Click Rate</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center p-4 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-xl border border-fuchsia-200 shadow-sm"
                  >
                    <Award className="h-5 w-5 text-fuchsia-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">#{metrics.seo.avgPosition.toFixed(1)}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Avg. Position</p>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Connect Google Search Console to see SEO performance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Connection Status Grid */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-600" />
              Platform Connections
            </CardTitle>
            <CardDescription>
              {connectedCount} of {totalPlatforms} platforms connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Google Analytics", connected: hasGA, path: "analytics", color: "blue" },
                { name: "Google Ads", connected: hasAds, path: "ads", color: "emerald" },
                { name: "Meta Ads", connected: hasMetaAds, path: "meta-ads", color: "indigo" },
                { name: "Search Console", connected: hasSearchConsole, path: "search-console", color: "purple" },
                { name: "Facebook", connected: hasFacebook, path: "facebook", color: "blue" },
                { name: "Instagram", connected: hasInstagram, path: "instagram", color: "pink" },
                { name: "YouTube", connected: hasYouTube, path: "youtube", color: "red" },
                { name: "LinkedIn", connected: hasLinkedIn, path: "linkedin", color: "sky" },
                { name: "Google Reviews", connected: hasGBP, path: "reviews", color: "amber" },
              ].map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => navigate(`/dashboard/${projectId}/${platform.path}`)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${platform.connected
                    ? "border-green-200 bg-green-50 hover:bg-green-100"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{platform.name}</span>
                    {platform.connected ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <p className={`text-xs ${platform.connected ? "text-green-600" : "text-slate-500"}`}>
                    {platform.connected ? "Connected" : "Not connected"}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Magic Suggestion Modal */}
      <MagicSuggestionModal
        isOpen={showMagicSuggestions}
        onClose={() => setShowMagicSuggestions(false)}
        projectId={projectId!}
        metrics={metrics}
      />
    </motion.section>
  );
};

export default DashboardOverviewPage;
