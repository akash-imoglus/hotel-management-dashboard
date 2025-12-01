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
  TrendingUp,
  RefreshCw,
  UserPlus,
  Share2,
  MousePointer,
  ExternalLink,
  Image,
  Video,
  FileText
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ReconnectButton from "@/components/common/ReconnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectFacebook from "@/components/projects/ConnectFacebook";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import type { DateRange, Project } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

interface FacebookOverview {
  pageViews: number;
  reach: number;
  organicReach: number;
  paidReach: number;
  contentInteractions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  linkClicks: number;
  pageFollowers: number;
  pageLikes: number;
  newFollowers: number;
  unfollowers: number;
  impressions: number;
  organicImpressions: number;
  paidImpressions: number;
  engagementRate: number;
}

interface TimeSeriesData {
  date: string;
  engagement: number;
  followers: number;
  reach: number;
  organicImpressions: number;
  pageViews: number;
}

interface FollowData {
  date: string;
  followers: number;
  unfollowers: number;
}

interface FacebookPost {
  id: string;
  message: string;
  createdTime: string;
  type: string;
  permalink: string;
  thumbnailUrl?: string;
  reactions: number;
  comments: number;
  shares: number;
  reach?: number;
  impressions?: number;
  engagements?: number;
  videoViews?: number;
  avgWatchTime?: number;
  linkClicks?: number;
}

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

const formatFullDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatSeconds = (seconds: number | undefined | null): string => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const CHART_COLORS = {
  engagement: '#6366f1',
  followers: '#10b981',
  reach: '#f59e0b',
  organicImpressions: '#3b82f6',
  pageViews: '#8b5cf6',
};

const FacebookPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<FacebookOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [followData, setFollowData] = useState<FollowData[]>([]);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [rangePreset, setRangePreset] = useState<DateRangePreset>("7d");
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [dateRange, setDateRange] = useState<DateRange>(buildDateRange("7d"));
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');

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
      // Fetch all data in parallel
      const [overviewRes, timeSeriesRes, followsRes, postsRes] = await Promise.all([
        api.get<{ success: boolean; data: FacebookOverview }>(`/facebook/overview/${projectId}`, { params }),
        api.get<{ success: boolean; data: TimeSeriesData[] }>(`/facebook/timeseries/${projectId}`, { params }),
        api.get<{ success: boolean; data: FollowData[] }>(`/facebook/follows/${projectId}`, { params }),
        api.get<{ success: boolean; data: FacebookPost[] }>(`/facebook/posts/${projectId}`, { params }),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (timeSeriesRes.data.success) setTimeSeries(timeSeriesRes.data.data);
      if (followsRes.data.success) setFollowData(followsRes.data.data);
      if (postsRes.data.success) setPosts(postsRes.data.data);
    } catch (err: any) {
      setDataError(err.response?.data?.error || "Failed to load Facebook insights");
    } finally {
      setLoadingData(false);
    }
  }, [projectId, project?.facebookPageId, dateRange]);

  useEffect(() => {
    void fetchFacebookData();
  }, [fetchFacebookData]);

  const handleApplyRange = () => {
    const newRange = buildDateRange(rangePreset, customRange);
    setDateRange(newRange);
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
                  Link your page to view engagement, reach, and post insights.
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

  // Prepare reach pie chart data
  const reachPieData = overview ? [
    { name: 'Organic', value: overview.organicReach || overview.reach, color: '#f59e0b' },
    { name: 'Paid', value: overview.paidReach || 0, color: '#3b82f6' },
  ].filter(d => d.value > 0) : [];

  // Get post type icon and label
  const getPostType = (type: string) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video') || typeLower === 'added_video') {
      return { icon: <Video className="h-4 w-4 text-purple-500" />, label: 'Video' };
    }
    if (typeLower.includes('photo') || typeLower === 'added_photos') {
      return { icon: <Image className="h-4 w-4 text-green-500" />, label: 'Photo' };
    }
    if (typeLower === 'reel') {
      return { icon: <Video className="h-4 w-4 text-pink-500" />, label: 'Reel' };
    }
    return { icon: <FileText className="h-4 w-4 text-slate-500" />, label: 'Post' };
  };

  return (
    <motion.section 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header - DM Cockpit Style */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <FacebookIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/80">{project?.name}</p>
            <h1 className="text-2xl font-bold">Facebook</h1>
            <p className="text-xs text-white/70">{overview?.pageFollowers?.toLocaleString() || 0} Followers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="facebook"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
            variant="ghost"
            className="text-white border-white/20 hover:bg-white/10"
          />
          <Button variant="ghost" onClick={fetchFacebookData} disabled={loadingData} className="text-white hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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

      {loadingData && !overview ? (
        <LoadingState message="Loading Facebook data..." />
      ) : dataError ? (
        <ErrorState description={dataError} onRetry={fetchFacebookData} />
      ) : overview ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Page Views</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(overview.pageViews)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Eye className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-100 text-sm font-medium">Reach</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(overview.reach)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-violet-100 text-sm font-medium">Content Interactions</p>
                      <p className="text-3xl font-bold mt-1">{formatNumber(overview.contentInteractions)}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <MousePointer className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-slate-300 font-medium uppercase mb-2">Total Post</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <ThumbsUp className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                      <p className="text-lg font-bold">{formatNumber(overview.totalLikes)}</p>
                      <p className="text-[10px] text-slate-400">Likes</p>
                    </div>
                    <div>
                      <MessageCircle className="h-4 w-4 mx-auto text-green-400 mb-1" />
                      <p className="text-lg font-bold">{formatNumber(overview.totalComments)}</p>
                      <p className="text-[10px] text-slate-400">Comments</p>
                    </div>
                    <div>
                      <Share2 className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                      <p className="text-lg font-bold">{formatNumber(overview.totalShares)}</p>
                      <p className="text-[10px] text-slate-400">Shares</p>
                    </div>
                    <div>
                      <ExternalLink className="h-4 w-4 mx-auto text-amber-400 mb-1" />
                      <p className="text-lg font-bold">{formatNumber(overview.linkClicks)}</p>
                      <p className="text-[10px] text-slate-400">Link Clicks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Page Engagement Chart - DM Cockpit Style */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-900">Page Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              {timeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeSeries} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                      tickFormatter={(v) => formatNumber(v)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelFormatter={formatFullDate}
                      formatter={(value: any, name: string) => [formatNumber(value), name]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                    />
                    <Line type="monotone" dataKey="engagement" name="Engagement" stroke={CHART_COLORS.engagement} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="followers" name="Follower" stroke={CHART_COLORS.followers} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="reach" name="Reach" stroke={CHART_COLORS.reach} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="organicImpressions" name="Organic Impressions" stroke={CHART_COLORS.organicImpressions} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="pageViews" name="Page Views" stroke={CHART_COLORS.pageViews} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No engagement data available for this period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follows/Unfollows and Reach Charts - DM Cockpit Style */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Follows/Unfollows Chart */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-900">
                  Follows | Unfollows Last {rangePreset === '7d' ? '7' : rangePreset === '30d' ? '30' : '28'} Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                {followData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={followData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                        labelFormatter={formatFullDate}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="followers" name="Follower" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="unfollowers" name="Unfollower" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No follower data available</p>
                      <p className="text-xs mt-1">New: {overview?.newFollowers || 0} | Lost: {overview?.unfollowers || 0}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reach Donut Chart */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-900">Reach</CardTitle>
              </CardHeader>
              <CardContent>
                {reachPieData.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="60%" height={220}>
                      <PieChart>
                        <Pie
                          data={reachPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {reachPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value: any) => [formatNumber(value), 'Users']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {reachPieData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-sm text-slate-700">{item.name}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500">Total Reach</p>
                        <p className="text-lg font-bold text-slate-900">{formatNumber(overview?.reach)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No reach data available</p>
                      <p className="text-xs mt-1">Total: {formatNumber(overview?.reach)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Posts Table - DM Cockpit Style */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'posts'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Post
                  </button>
                  <button
                    onClick={() => setActiveTab('stories')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'stories'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Story
                  </button>
                </div>
                <span className="text-xs text-slate-500">{posts.length} posts</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {posts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-medium text-slate-600 w-12">Post</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Caption</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600 w-20">Type</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Reactions</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Comments</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Share</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Avg. Watch Time</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Total Reactions</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600 w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post, index) => {
                        const postType = getPostType(post.type);
                        const totalReactions = post.reactions + post.comments + post.shares;
                        return (
                          <tr key={post.id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              {post.thumbnailUrl ? (
                                <img 
                                  src={post.thumbnailUrl} 
                                  alt="" 
                                  className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                  {postType.icon}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-slate-900 line-clamp-2 max-w-[250px]">
                                {post.message ? (
                                  <>
                                    {post.message.substring(0, 50)}
                                    {post.message.length > 50 && (
                                      <>
                                        ...{' '}
                                        <a 
                                          href={post.permalink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          Read more
                                        </a>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-400 italic">No caption</span>
                                )}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                {postType.icon}
                                {postType.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="inline-flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3 text-blue-500" />
                                  {post.reactions}
                                </span>
                                {post.reactions > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Heart className="h-3 w-3 text-red-500" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">{post.comments}</td>
                            <td className="px-4 py-3 text-right text-slate-700">{post.shares}</td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatSeconds(post.avgWatchTime)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">{totalReactions}</td>
                            <td className="px-4 py-3 text-center">
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors inline-flex"
                                title="View on Facebook"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-slate-400">
                  No posts found for this period
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

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
