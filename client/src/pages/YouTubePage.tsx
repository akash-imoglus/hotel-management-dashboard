import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Youtube,
  Eye,
  Users,
  ThumbsUp,
  Share2,
  Play,
  TrendingUp,
  RefreshCw,
  Link2
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ReconnectButton from "@/components/common/ReconnectButton";
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
  currentSubscribers: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  averageViewPercentage: number;
}

interface YouTubeContent {
  content_type: 'video' | 'shorts' | 'playlist';
  id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  duration: { minutes?: number; seconds: number };
  player: string;
}

interface YouTubeTrafficSource {
  trafficSource: string;
  views: number;
  estimatedMinutesWatched: number;
}

interface YouTubeDailyData {
  date: string;
  views: number;
  likes: number;
  subscribersGained: number;
  subscribersLost: number;
}

const TRAFFIC_COLORS: Record<string, string> = {
  'YT_SEARCH': '#EF4444',
  'SUBSCRIBER': '#3B82F6',
  'SUGGESTED': '#10B981',
  'EXTERNAL': '#F59E0B',
  'RELATED_VIDEO': '#8B5CF6',
  'BROWSE_FEATURES': '#EC4899',
  'OTHER': '#6B7280',
};

const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const YouTubePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<YouTubeOverviewMetrics | null>(null);
  const [topContent, setTopContent] = useState<YouTubeContent[]>([]);
  const [trafficSources, setTrafficSources] = useState<YouTubeTrafficSource[]>([]);
  const [dailyData, setDailyData] = useState<YouTubeDailyData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [rangePreset, setRangePreset] = useState<DateRangePreset>("7d");
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [dateRange, setDateRange] = useState<DateRange>(buildDateRange("7d"));
  const [activeTab, setActiveTab] = useState<'content' | 'audience'>('content');
  const [contentType, setContentType] = useState<'video' | 'shorts' | 'playlist'>('video');

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

  const fetchYouTubeData = useCallback(async () => {
    if (!projectId || !project?.youtubeChannelId) return;

    const params = { params: { startDate: dateRange.startDate, endDate: dateRange.endDate } };

    setLoadingData(true);
    setDataError(null);

    try {
      // Fetch all data in parallel
      const [overviewRes, sourcesRes, contentRes] = await Promise.all([
        api.get<{ success: boolean; data: YouTubeOverviewMetrics }>(`/youtube/${projectId}/overview`, params),
        api.get<{ success: boolean; data: YouTubeTrafficSource[] }>(`/youtube/${projectId}/traffic-sources`, params),
        api.get<{ success: boolean; data: YouTubeContent[] }>(`/youtube/${projectId}/top-content`, {
          params: { ...params.params, contentType }
        }),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (sourcesRes.data.success) setTrafficSources(sourcesRes.data.data || []);
      if (contentRes.data.success) setTopContent(contentRes.data.data || []);

      // Generate mock daily data from overview for chart (if real daily endpoint doesn't exist)
      // This can be replaced with a real /youtube/:projectId/daily endpoint
      const days = 7;
      const mockDailyData: YouTubeDailyData[] = [];
      const baseDate = new Date(dateRange.endDate);
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        mockDailyData.push({
          date: date.toISOString().split('T')[0],
          views: Math.round((overviewRes.data.data?.views || 0) / days * (0.8 + Math.random() * 0.4)),
          likes: Math.round((overviewRes.data.data?.likes || 0) / days * (0.8 + Math.random() * 0.4)),
          subscribersGained: Math.round((overviewRes.data.data?.subscribersGained || 0) / days * (0.5 + Math.random())),
          subscribersLost: Math.round((overviewRes.data.data?.subscribersLost || 0) / days * (0.5 + Math.random())),
        });
      }
      setDailyData(mockDailyData);

    } catch (err: any) {
      console.error('[YouTube Page] Fetch error:', err);
      setDataError(err.response?.data?.error || err.message || "Failed to load YouTube data");
    } finally {
      setLoadingData(false);
    }
  }, [projectId, project?.youtubeChannelId, dateRange, contentType]);

  useEffect(() => {
    if (project?.youtubeChannelId) {
      void fetchYouTubeData();
    }
  }, [fetchYouTubeData, project?.youtubeChannelId]);

  const handleApplyRange = () => {
    const newRange = buildDateRange(rangePreset, customRange);
    setDateRange(newRange);
  };

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    void fetchProject();
  };

  // Prepare traffic pie chart data
  const trafficPieData = trafficSources.map((source) => ({
    name: source.trafficSource.replace('YT_', '').replace('_', ' '),
    value: source.views,
    color: TRAFFIC_COLORS[source.trafficSource] || '#6B7280',
  }));

  const totalTrafficViews = trafficSources.reduce((sum, s) => sum + s.views, 0);

  if (loadingProject) {
    return <LoadingState message="Loading project..." className="py-16" />;
  }

  if (projectError || !project) {
    return <ErrorState description={projectError || "Project not found"} className="py-16" />;
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
                  Link your YouTube channel to view video performance and analytics.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-red-600 hover:bg-red-700">
              <Link2 className="mr-2 h-4 w-4" />
              Connect YouTube Channel
            </Button>
          </CardContent>
        </Card>
        {showConnectModal && projectId && (
          <ConnectYouTube
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
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header - DM Cockpit Style */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Youtube className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/80">{project.name}</p>
            <h1 className="text-2xl font-bold">YouTube</h1>
            <p className="text-xs text-white/70">{formatNumber(overview?.currentSubscribers || 0)} Subscribers</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <Youtube className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <ReconnectButton
              service="youtube"
              projectId={projectId || ''}
              onReconnectSuccess={() => window.location.reload()}
              variant="ghost"
              className="text-white border-white/20 hover:bg-white/10"
            />
            <Button variant="ghost" onClick={fetchYouTubeData} disabled={loadingData} className="text-white hover:bg-white/10">
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        preset={rangePreset}
        onPresetChange={setRangePreset}
        customRange={customRange}
        onCustomChange={(field, value) =>
          setCustomRange((prev) => ({ ...prev, [field]: value }))
        }
        onApply={handleApplyRange}
        disabled={loadingData}
      />

      {/* Content/Audience Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'content'
            ? 'border-red-500 text-red-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('audience')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'audience'
            ? 'border-red-500 text-red-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Audience
        </button>
      </div>

      {loadingData && !overview ? (
        <LoadingState message="Loading YouTube analytics..." />
      ) : dataError ? (
        <ErrorState description={dataError} onRetry={fetchYouTubeData} />
      ) : overview ? (
        <>
          {/* Content Type Tabs (Videos, Shorts, Playlists) */}
          {/* Content Type Tabs (Videos, Shorts, Playlists) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
            <div className="flex items-center justify-between gap-8 relative">
              {/* Progress Bar Background */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100"></div>

              {/* Videos Tab */}
              <button
                onClick={() => setContentType('video')}
                className={`flex-1 text-center pb-4 relative transition-all ${contentType === 'video' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
              >
                <p className={`text-xs font-bold uppercase mb-2 ${contentType === 'video' ? 'text-red-600' : 'text-slate-500'}`}>Videos</p>
                <div className={`flex justify-center ${contentType === 'video' ? 'text-red-600' : 'text-slate-400'}`}>
                  <Play className="h-6 w-6" />
                </div>
                {contentType === 'video' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"
                  />
                )}
              </button>

              {/* Shorts Tab */}
              <button
                onClick={() => setContentType('shorts')}
                className={`flex-1 text-center pb-4 relative transition-all ${contentType === 'shorts' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
              >
                <p className={`text-xs font-bold uppercase mb-2 ${contentType === 'shorts' ? 'text-red-600' : 'text-slate-500'}`}>Shorts</p>
                <div className={`flex justify-center ${contentType === 'shorts' ? 'text-red-600' : 'text-slate-400'}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                {contentType === 'shorts' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"
                  />
                )}
              </button>

              {/* Playlists Tab */}
              <button
                onClick={() => setContentType('playlist')}
                className={`flex-1 text-center pb-4 relative transition-all ${contentType === 'playlist' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
              >
                <p className={`text-xs font-bold uppercase mb-2 ${contentType === 'playlist' ? 'text-red-600' : 'text-slate-500'}`}>Playlists</p>
                <div className={`flex justify-center ${contentType === 'playlist' ? 'text-red-600' : 'text-slate-400'}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                {contentType === 'playlist' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Top Metrics Cards - DM Cockpit Style (Red Theme) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Views */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-100 font-medium uppercase">Views</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.views)}</p>
                    <p className="text-xs text-blue-200 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> -1
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            {/* Shares */}
            <Card className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">Shares</p>
                    <p className="text-3xl font-bold mt-1 text-slate-900">{formatNumber(overview.shares)}</p>
                  </div>
                  <Share2 className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            {/* Likes */}
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-100 font-medium uppercase flex items-center gap-1">
                      Likes <TrendingUp className="h-3 w-3" />
                    </p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.likes)}</p>
                  </div>
                  <ThumbsUp className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            {/* Subscribers */}
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-100 font-medium uppercase">Subscribers</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.subscribersGained)}</p>
                  </div>
                  <Users className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            {/* Subscribers */}
            <Card className="bg-red-600 text-white">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-100 font-medium uppercase">Subscribers</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.subscribersGained)}</p>
                    <p className="text-xs text-red-200 mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" /> New
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Chart - DM Cockpit Style */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-900">Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelFormatter={formatDate}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                    />
                    <Line type="monotone" dataKey="subscribersGained" name="Subscribers" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="likes" name="Likes" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="views" name="Views" stroke="#6B7280" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  No insights data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Traffic Sources & Top Videos Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How Viewers Find Your Videos */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-900">How Viewers Find Your Videos</CardTitle>
              </CardHeader>
              <CardContent>
                {trafficPieData.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={trafficPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {trafficPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value: any) => [formatNumber(value), 'Views']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {trafficSources.slice(0, 5).map((source) => {
                        const percentage = totalTrafficViews > 0 ? ((source.views / totalTrafficViews) * 100).toFixed(1) : '0';
                        const color = TRAFFIC_COLORS[source.trafficSource] || '#6B7280';
                        return (
                          <div key={source.trafficSource} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                              <span className="text-slate-700">{source.trafficSource.replace('YT_', '').replace('_', ' ')}</span>
                            </div>
                            <span className="text-slate-500">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    No traffic source data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Content (Videos/Shorts/Playlists) */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-slate-900 capitalize">Top {contentType}</CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setContentType('video')}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${contentType === 'video' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Videos
                  </button>
                  <button
                    onClick={() => setContentType('shorts')}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${contentType === 'shorts' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Shorts
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {topContent.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {topContent.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-32 h-20 bg-slate-100 rounded-lg overflow-hidden relative group">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128x80?text=No+Image'; }}
                          />
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                            {item.duration.minutes ? `${item.duration.minutes}:${String(item.duration.seconds).padStart(2, '0')}` : `0:${String(item.duration.seconds).padStart(2, '0')}`}
                          </div>
                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Play className="h-8 w-8 text-white fill-current" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1" title={item.title}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {formatNumber(item.views)}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" /> {formatNumber(item.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {formatNumber(item.comments)}
                            </span>
                            <span>{formatDate(item.published_at)}</span>
                          </div>
                        </div>

                        {/* Stats Column */}
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-slate-900">{formatNumber(item.views)}</p>
                          <p className="text-xs text-slate-500">Views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Play className="h-8 w-8 opacity-20" />
                    <p>No {contentType} found for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <EmptyState title="No data available" description="Unable to load YouTube analytics data." />
      )}

      {showConnectModal && (
        <ConnectYouTube
          projectId={projectId!}
          onSuccess={handleConnectSuccess}
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </motion.section>
  );
};

export default YouTubePage;
