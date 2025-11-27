import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Youtube, 
  Eye, 
  Clock, 
  Users, 
  Timer, 
  ThumbsUp, 
  MessageCircle, 
  Share2,
  TrendingUp,
  Play,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  Globe,
  ExternalLink
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ReactCountryFlag from "react-country-flag";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectYouTube from "@/components/projects/ConnectYouTube";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import type { DateRange, Project } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

interface YouTubeOverviewMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  averageViewPercentage: number;
}

interface YouTubeVideoData {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  subscribersGained: number;
}

interface YouTubeTrafficSource {
  trafficSource: string;
  views: number;
  estimatedMinutesWatched: number;
}

interface YouTubeDeviceType {
  deviceType: string;
  views: number;
  estimatedMinutesWatched: number;
}

interface YouTubeGeography {
  country: string;
  views: number;
  estimatedMinutesWatched: number;
}

// Country code mapping for flags
const countryCodeMap: Record<string, string> = {
  "United States": "US",
  "India": "IN",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Australia": "AU",
  "Germany": "DE",
  "France": "FR",
  "Brazil": "BR",
  "Japan": "JP",
  "Mexico": "MX",
  "Spain": "ES",
  "Italy": "IT",
  "Netherlands": "NL",
  "Russia": "RU",
  "South Korea": "KR",
  "Indonesia": "ID",
  "Turkey": "TR",
  "Saudi Arabia": "SA",
  "Argentina": "AR",
  "Poland": "PL",
  "Philippines": "PH",
  "Thailand": "TH",
  "Vietnam": "VN",
  "Malaysia": "MY",
  "Pakistan": "PK",
  "Bangladesh": "BD",
  "Nigeria": "NG",
  "South Africa": "ZA",
  "Egypt": "EG",
  "Colombia": "CO",
  "Chile": "CL",
  "Peru": "PE",
  "UAE": "AE",
  "Singapore": "SG",
  "Hong Kong": "HK",
  "Taiwan": "TW",
  "Sweden": "SE",
  "Norway": "NO",
  "Denmark": "DK",
  "Finland": "FI",
  "Belgium": "BE",
  "Austria": "AT",
  "Switzerland": "CH",
  "Portugal": "PT",
  "Greece": "GR",
  "Czech Republic": "CZ",
  "Romania": "RO",
  "Ukraine": "UA",
  "Israel": "IL",
  "New Zealand": "NZ",
  "Ireland": "IE",
};

// Chart colors
const CHART_COLORS = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", 
  "#FF9F40", "#E7E9ED", "#7CB342", "#039BE5", "#8E24AA"
];

const DEVICE_COLORS: Record<string, string> = {
  "MOBILE": "#10B981",
  "DESKTOP": "#3B82F6",
  "TABLET": "#8B5CF6",
  "TV": "#F59E0B",
  "GAME_CONSOLE": "#EF4444",
};

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType.toUpperCase()) {
    case "MOBILE": return Smartphone;
    case "DESKTOP": return Monitor;
    case "TABLET": return Tablet;
    case "TV": return Tv;
    default: return Monitor;
  }
};

const YouTubePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<YouTubeOverviewMetrics | null>(null);
  const [topVideos, setTopVideos] = useState<YouTubeVideoData[]>([]);
  const [trafficSources, setTrafficSources] = useState<YouTubeTrafficSource[]>([]);
  const [devices, setDevices] = useState<YouTubeDeviceType[]>([]);
  const [geography, setGeography] = useState<YouTubeGeography[]>([]);
  const [loadingYouTube, setLoadingYouTube] = useState(true);
  const [youtubeErrors, setYouTubeErrors] = useState<Record<string, string | null>>({
    overview: null,
    topVideos: null,
    trafficSources: null,
    devices: null,
    geography: null,
  });

  const [rangePreset, setRangePreset] = useState<DateRangePreset>("7d");
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [activeRange, setActiveRange] = useState<DateRange>(() => buildDateRange("7d"));

  const params = useMemo(
    () => ({
      params: {
        startDate: activeRange.startDate,
        endDate: activeRange.endDate,
      },
    }),
    [activeRange]
  );

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingProject(true);
      const response = await api.get<{ success: boolean; data: Project }>(`/projects/${projectId}`);
      const project = response.data.data || response.data;
      setProject(project as Project);
      setProjectError(null);
    } catch (error) {
      setProjectError(
        error instanceof Error ? error.message : "Project not found."
      );
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  const fetchYouTubeData = useCallback(async () => {
    if (!projectId || !project?.youtubeChannelId) return;
    
    setLoadingYouTube(true);
    setYouTubeErrors({
      overview: null,
      topVideos: null,
      trafficSources: null,
      devices: null,
      geography: null,
    });

    // Fetch overview metrics
    try {
      const overviewRes = await api.get<{ success: boolean; data: YouTubeOverviewMetrics }>(
        `/youtube/${projectId}/overview`,
        params
      );
      setOverview(overviewRes.data.data);
    } catch (error: any) {
      setYouTubeErrors((prev) => ({
        ...prev,
        overview: error.response?.data?.error || error.message,
      }));
    }

    // Fetch top videos
    try {
      const videosRes = await api.get<{ success: boolean; data: YouTubeVideoData[] }>(
        `/youtube/${projectId}/top-videos`,
        params
      );
      setTopVideos(videosRes.data.data || []);
    } catch (error: any) {
      setYouTubeErrors((prev) => ({
        ...prev,
        topVideos: error.response?.data?.error || error.message,
      }));
    }

    // Fetch traffic sources
    try {
      const sourcesRes = await api.get<{ success: boolean; data: YouTubeTrafficSource[] }>(
        `/youtube/${projectId}/traffic-sources`,
        params
      );
      setTrafficSources(sourcesRes.data.data || []);
    } catch (error: any) {
      setYouTubeErrors((prev) => ({
        ...prev,
        trafficSources: error.response?.data?.error || error.message,
      }));
    }

    // Fetch devices
    try {
      const devicesRes = await api.get<{ success: boolean; data: YouTubeDeviceType[] }>(
        `/youtube/${projectId}/devices`,
        params
      );
      setDevices(devicesRes.data.data || []);
    } catch (error: any) {
      setYouTubeErrors((prev) => ({
        ...prev,
        devices: error.response?.data?.error || error.message,
      }));
    }

    // Fetch geography
    try {
      const geoRes = await api.get<{ success: boolean; data: YouTubeGeography[] }>(
        `/youtube/${projectId}/geography`,
        params
      );
      setGeography(geoRes.data.data || []);
    } catch (error: any) {
      setYouTubeErrors((prev) => ({
        ...prev,
        geography: error.response?.data?.error || error.message,
      }));
    }

    setLoadingYouTube(false);
  }, [projectId, project?.youtubeChannelId, params]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project) {
      void fetchYouTubeData();
    }
  }, [fetchYouTubeData, project]);

  const handleApplyRange = () => {
    setActiveRange(buildDateRange(rangePreset, customRange.startDate && customRange.endDate ? {
      startDate: customRange.startDate,
      endDate: customRange.endDate
    } : undefined));
  };

  const handleRefresh = () => {
    void fetchYouTubeData();
  };

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    void fetchProject();
  };

  if (loadingProject) {
    return <LoadingState message="Loading project..." />;
  }

  if (projectError) {
    return <ErrorState description={projectError} onRetry={fetchProject} />;
  }

  if (!project) {
    return <EmptyState title="Project not found" description="The requested project could not be found." />;
  }

  if (!project.youtubeChannelId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">YouTube Analytics</h1>
          <p className="text-sm text-slate-500">Connect your YouTube channel to view analytics</p>
        </div>

        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <Youtube className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect YouTube</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your YouTube channel to view video performance, audience insights, and more.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowConnectModal(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Youtube className="mr-2 h-4 w-4" />
              Connect YouTube Channel
            </Button>
          </CardContent>
        </Card>

        {showConnectModal && (
          <ConnectYouTube
            projectId={projectId!}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Prepare chart data
  const trafficChartData = trafficSources.map((source, index) => ({
    name: source.trafficSource,
    value: source.views,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const deviceChartData = devices.map((device) => ({
    name: device.deviceType,
    value: device.views,
    color: DEVICE_COLORS[device.deviceType.toUpperCase()] || "#6B7280",
  }));

  const topVideosChartData = topVideos.slice(0, 5).map((video) => ({
    name: video.title.length > 25 ? video.title.substring(0, 25) + "..." : video.title,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
  }));

  const totalTrafficViews = trafficSources.reduce((sum, s) => sum + s.views, 0);
  const totalDeviceViews = devices.reduce((sum, d) => sum + d.views, 0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.section 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg shadow-red-500/25">
            <Youtube className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">YouTube Analytics</h1>
            <p className="text-sm text-slate-500">
              Insights from {activeRange.startDate} to {activeRange.endDate}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={loadingYouTube}
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Refresh data
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DateRangeSelector
          preset={rangePreset}
          onPresetChange={setRangePreset}
          customRange={customRange}
          onCustomChange={(field, value) =>
            setCustomRange((prev) => ({ ...prev, [field]: value }))
          }
          onApply={handleApplyRange}
          disabled={loadingYouTube}
        />
      </motion.div>

      {/* Overview Cards */}
      {loadingYouTube ? (
        <LoadingState message="Loading YouTube metrics..." />
      ) : youtubeErrors.overview ? (
        <motion.div variants={itemVariants} className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
              <p className="text-sm text-red-800 mb-4">
                {youtubeErrors.overview.includes("YouTube Analytics API") ? (
                  <>
                    YouTube Analytics API has not been enabled yet.
                    <br /><br />
                    <strong>📝 Please enable the YouTube Analytics API:</strong>
                    <br />
                    Visit{" "}
                    <a 
                      href="https://console.developers.google.com/apis/api/youtubeanalytics.googleapis.com/overview?project=906431561508"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium hover:text-red-600"
                    >
                      Google Cloud Console
                    </a>
                    {" "}and click "Enable API". Wait 2-3 minutes, then retry.
                  </>
                ) : (
                  youtubeErrors.overview
                )}
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                Retry
              </Button>
            </div>
          </div>
        </motion.div>
      ) : overview ? (
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Views Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-blue-100">Total Views</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(overview.views)}</div>
            </div>
          </div>

          {/* Watch Time Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg shadow-purple-500/25">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-purple-100">Watch Time</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(overview.estimatedMinutesWatched)}</div>
              <div className="text-sm text-purple-200 mt-1">minutes</div>
            </div>
          </div>

          {/* Subscribers Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg shadow-emerald-500/25">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-emerald-100">Subscribers</span>
              </div>
              <div className="text-3xl font-bold">+{formatNumber(overview.subscribersGained)}</div>
              {overview.subscribersLost > 0 && (
                <div className="text-sm text-emerald-200 mt-1">-{overview.subscribersLost} lost</div>
              )}
            </div>
          </div>

          {/* Avg Duration Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-lg shadow-amber-500/25">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Timer className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-amber-100">Avg. Duration</span>
              </div>
              <div className="text-3xl font-bold">{formatDuration(overview.averageViewDuration)}</div>
              <div className="text-sm text-amber-200 mt-1">{overview.averageViewPercentage?.toFixed(1) || 0}% watched</div>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Engagement Stats */}
      {overview && (
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-100 rounded-xl">
                  <ThumbsUp className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Likes</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(overview.likes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Comments</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(overview.comments)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Share2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Shares</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(overview.shares)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Videos */}
      {topVideos.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white border-slate-200 overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Play className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Top Performing Videos</CardTitle>
                  <CardDescription className="text-slate-500">Your best-performing videos in the selected period</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Bar Chart */}
              {topVideosChartData.length > 0 && (
                <div className="p-6 border-b border-slate-100">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topVideosChartData} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="views" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Video List */}
              <div className="divide-y divide-slate-100">
                {topVideos.map((video, index) => (
                  <motion.div 
                    key={video.videoId} 
                    className="p-4 hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-600">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <a 
                          href={`https://youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-900 hover:text-red-600 transition-colors flex items-center gap-2 group"
                        >
                          <span className="truncate">{video.title}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Eye className="h-4 w-4" />
                          <span className="font-medium">{formatNumber(video.views)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="font-medium">{formatNumber(video.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MessageCircle className="h-4 w-4" />
                          <span className="font-medium">{formatNumber(video.comments)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Traffic Sources & Devices */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Traffic Sources */}
        {trafficSources.length > 0 && (
          <Card className="bg-white border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Traffic Sources</CardTitle>
                  <CardDescription className="text-slate-500">Where your viewers are coming from</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={trafficChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {trafficChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatNumber(value) + ' views', '']}
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {trafficSources.slice(0, 5).map((source, index) => {
                    const percentage = totalTrafficViews > 0 ? (source.views / totalTrafficViews) * 100 : 0;
                    return (
                      <div key={source.trafficSource} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{source.trafficSource}</span>
                          <span className="text-slate-900 font-semibold">{formatNumber(source.views)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Devices */}
        {devices.length > 0 && (
          <Card className="bg-white border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Monitor className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Device Types</CardTitle>
                  <CardDescription className="text-slate-500">How viewers watch your content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {deviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatNumber(value) + ' views', '']}
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4">
                  {devices.map((device) => {
                    const Icon = getDeviceIcon(device.deviceType);
                    const percentage = totalDeviceViews > 0 ? (device.views / totalDeviceViews) * 100 : 0;
                    const color = DEVICE_COLORS[device.deviceType.toUpperCase()] || "#6B7280";
                    return (
                      <div key={device.deviceType} className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: color + '20' }}
                        >
                          <Icon className="h-4 w-4" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700 capitalize">{device.deviceType.toLowerCase()}</span>
                            <span className="text-slate-900 font-semibold">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Geography */}
      {geography.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Globe className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Geographic Distribution</CardTitle>
                  <CardDescription className="text-slate-500">Where your viewers are located</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {geography.map((geo, index) => {
                  const countryCode = countryCodeMap[geo.country] || geo.country.slice(0, 2).toUpperCase();
                  const totalGeoViews = geography.reduce((sum, g) => sum + g.views, 0);
                  const percentage = totalGeoViews > 0 ? (geo.views / totalGeoViews) * 100 : 0;
                  
                  return (
                    <motion.div 
                      key={geo.country} 
                      className="p-4 hover:bg-slate-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <ReactCountryFlag
                            countryCode={countryCode}
                            svg
                            style={{
                              width: '2em',
                              height: '1.5em',
                              borderRadius: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                            title={geo.country}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900">{geo.country}</span>
                            <span className="text-sm text-slate-600">{formatNumber(geo.views)} views</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.6, delay: index * 0.03 }}
                            />
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-sm font-semibold text-slate-900">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.section>
  );
};

export default YouTubePage;
