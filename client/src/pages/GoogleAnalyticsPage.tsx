import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Link2,
  RefreshCw,
  AlertTriangle,
  Users,
  Eye,
  Clock,
  MousePointer,
  TrendingUp,
  Monitor,
  Globe,
  BarChart3,
  Percent
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ReactCountryFlag from "react-country-flag";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ReconnectButton from "@/components/common/ReconnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectGoogleAnalytics from "@/components/projects/ConnectGoogleAnalytics";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import type {
  ChannelMetric,
  DateRange,
  DeviceMetric,
  GeoMetric,
  LandingPageMetric,
  OverviewMetrics,
  Project,
} from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

// Color palette for charts
const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

// Country code mapping
const countryCodeMap: Record<string, string> = {
  "united states": "US", "india": "IN", "united kingdom": "GB", "canada": "CA",
  "australia": "AU", "germany": "DE", "france": "FR", "brazil": "BR",
  "japan": "JP", "mexico": "MX", "spain": "ES", "italy": "IT",
  "netherlands": "NL", "russia": "RU", "south korea": "KR", "indonesia": "ID",
  "turkey": "TR", "saudi arabia": "SA", "argentina": "AR", "poland": "PL",
  "philippines": "PH", "vietnam": "VN", "thailand": "TH", "malaysia": "MY",
  "singapore": "SG", "pakistan": "PK", "bangladesh": "BD", "nigeria": "NG",
  "egypt": "EG", "south africa": "ZA", "uae": "AE", "united arab emirates": "AE",
  "china": "CN", "taiwan": "TW", "hong kong": "HK",
};

const getCountryCode = (country: string) => {
  const lower = country.toLowerCase();
  return countryCodeMap[lower] || country.slice(0, 2).toUpperCase();
};



// Helper to detect token expiration errors
const isTokenError = (errorMsg: string) => {
  const lower = errorMsg.toLowerCase();
  return lower.includes('refresh') || lower.includes('token') || lower.includes('expired') || lower.includes('revoked');
};

const GoogleAnalyticsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<OverviewMetrics | undefined>();
  const [channels, setChannels] = useState<ChannelMetric[]>([]);
  const [devices, setDevices] = useState<DeviceMetric[]>([]);
  const [geo, setGeo] = useState<GeoMetric[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPageMetric[]>([]);
  const [chartErrors, setChartErrors] = useState<Record<string, string | null>>({
    overview: null,
    channels: null,
    devices: null,
    geo: null,
    landing: null,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);

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

  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;
    setLoadingAnalytics(true);
    setTokenExpired(false);

    setChartErrors({
      overview: null,
      channels: null,
      devices: null,
      geo: null,
      landing: null,
    });

    try {
      // Fetch overview
      try {
        const overviewRes = await api.get<{ success: boolean; data: OverviewMetrics }>(
          `/analytics/overview/${projectId}`,
          params
        );
        setOverview(overviewRes.data.data);
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.message;
        if (isTokenError(errorMsg)) setTokenExpired(true);
        setChartErrors((prev) => ({ ...prev, overview: errorMsg }));
      }

      // Fetch channels
      try {
        const channelsRes = await api.get<{ success: boolean; data: ChannelMetric[] }>(
          `/analytics/channels/${projectId}`,
          params
        );
        setChannels(channelsRes.data.data || []);
      } catch (error: any) {
        setChartErrors((prev) => ({
          ...prev,
          channels: error.response?.data?.error || error.message,
        }));
      }

      // Fetch devices
      try {
        const devicesRes = await api.get<{ success: boolean; data: DeviceMetric[] }>(
          `/analytics/devices/${projectId}`,
          params
        );
        setDevices(devicesRes.data.data || []);
      } catch (error: any) {
        setChartErrors((prev) => ({
          ...prev,
          devices: error.response?.data?.error || error.message,
        }));
      }

      // Fetch geo
      try {
        const geoRes = await api.get<{ success: boolean; data: GeoMetric[] }>(
          `/analytics/geo/${projectId}`,
          params
        );
        setGeo(geoRes.data.data || []);
      } catch (error: any) {
        setChartErrors((prev) => ({
          ...prev,
          geo: error.response?.data?.error || error.message,
        }));
      }

      // Fetch landing pages
      try {
        const landingRes = await api.get<{ success: boolean; data: LandingPageMetric[] }>(
          `/analytics/landing-pages/${projectId}`,
          params
        );
        setLandingPages(landingRes.data.data || []);
      } catch (error: any) {
        setChartErrors((prev) => ({
          ...prev,
          landing: error.response?.data?.error || error.message,
        }));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [projectId, params]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project?.gaPropertyId) {
      void fetchAnalytics();
    }
  }, [fetchAnalytics, project?.gaPropertyId]);

  const handleConnectSuccess = async () => {
    setShowConnectModal(false);
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchProject();
  };

  if (!projectId) {
    return (
      <EmptyState
        title="No project selected"
        description="Choose a project from your list to view analytics."
      />
    );
  }

  if (loadingProject) {
    return <LoadingState message="Loading project..." className="py-16" />;
  }

  if (projectError) {
    return (
      <ErrorState
        description={projectError}
        onRetry={fetchProject}
        className="py-16"
      />
    );
  }

  if (project && !project.gaPropertyId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Google Analytics</h1>
          <p className="text-sm text-slate-500">Connect your analytics property</p>
        </div>

        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Google Analytics</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your GA4 property to view website traffic and user behavior insights.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-orange-600 hover:bg-orange-700">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Analytics
            </Button>
          </CardContent>
        </Card>

        {showConnectModal && projectId && (
          <ConnectGoogleAnalytics
            projectId={projectId}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  const handleApplyRange = () => {
    setActiveRange(buildDateRange(rangePreset, customRange));
  };

  const handleRefresh = () => {
    void fetchAnalytics();
  };

  // Token expired state
  if (tokenExpired) {
    return (
      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Google Analytics</h1>
            <p className="text-sm text-slate-500">Session expired - reconnection required</p>
          </div>
        </div>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Session Expired</CardTitle>
                <CardDescription className="text-slate-600">
                  Your Google Analytics connection has expired.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>OAuth app in "testing" mode (tokens expire after 7 days)</li>
              <li>Refresh token was revoked in your Google account</li>
              <li>Permissions changed in Google Cloud Console</li>
            </ul>
            <div className="flex gap-3">
              <Button onClick={() => setShowConnectModal(true)} className="bg-orange-600 hover:bg-orange-700">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect Google Analytics
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {showConnectModal && projectId && (
          <ConnectGoogleAnalytics
            projectId={projectId}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  // Prepare chart data
  const channelChartData = channels.slice(0, 6).map((c, i) => ({
    name: c.channel || c.sessionDefaultChannelGroup,
    value: c.sessions || c.totalUsers,
    color: COLORS[i % COLORS.length]
  }));

  const deviceChartData = devices.map((d, i) => ({
    name: d.deviceCategory || d.device || 'Unknown',
    value: d.sessions || d.activeUsers || d.value || 0,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <motion.section
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/25">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Google Analytics</h1>
            <p className="text-sm text-slate-500">
              Insights from {activeRange.startDate} to {activeRange.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="google-analytics"
            projectId={projectId || ''}
            onReconnectSuccess={fetchProject}
          />
          <Button variant="outline" onClick={handleRefresh} disabled={loadingAnalytics}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingAnalytics ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <DateRangeSelector
        preset={rangePreset}
        onPresetChange={setRangePreset}
        customRange={customRange}
        onCustomChange={(field, value) =>
          setCustomRange((prev) => ({ ...prev, [field]: value }))
        }
        onApply={handleApplyRange}
        disabled={loadingAnalytics}
      />

      {/* Overview Cards */}
      {loadingAnalytics && !overview ? (
        <LoadingState message="Loading analytics data..." />
      ) : chartErrors.overview && !overview ? (
        <ErrorState description={chartErrors.overview} onRetry={handleRefresh} />
      ) : overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Users</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview?.totalUsers || 0)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Sessions</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview?.sessions || 0)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <MousePointer className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Page Views</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview?.screenPageViews || 0)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Eye className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Bounce Rate</p>
                    <p className="text-3xl font-bold mt-1">
                      {(overview?.bounceRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Percent className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Avg. Session Duration</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatDuration(overview?.averageSessionDuration || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="h-5 w-5 text-orange-600" />
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
                    <p className="text-slate-500 text-sm font-medium">Engagement Rate</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {(overview?.engagementRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
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
                    <p className="text-slate-500 text-sm font-medium">New Users</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatNumber(overview?.newUsers || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-5 w-5 text-blue-600" />
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
                    <p className="text-slate-500 text-sm font-medium">Sessions/User</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {(overview?.sessionsPerUser || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <MousePointer className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div >
      ) : null}

      {/* Channels Table */}
      {
        channels.length > 0 && (
          <Card className="bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Traffic Channels
              </CardTitle>
              <CardDescription className="text-slate-500">
                Session distribution by acquisition channel
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Channel</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Users</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sessions</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Bounce Rate</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Duration</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Conversions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {channels.map((channel, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-orange-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-slate-900">
                              {channel.channel || channel.sessionDefaultChannelGroup}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                          {formatNumber(channel.totalUsers || 0)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-700">
                          {formatNumber(channel.sessions || 0)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-700">
                          {(channel.bounceRate || 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-700">
                          {formatDuration(channel.averageSessionDuration || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">
                          {formatNumber(channel.conversions || 0)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Channel Distribution Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Session Channels
            </CardTitle>
            <CardDescription className="text-slate-500">Traffic source distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {channels.length > 0 ? (
              <div className="flex items-center gap-8">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {channelChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatNumber(value), 'Sessions']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {channelChartData.map((channel, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: channel.color }}
                      />
                      <span className="flex-1 text-sm font-medium text-slate-700 truncate">{channel.name}</span>
                      <span className="text-sm font-bold text-slate-900">{formatNumber(channel.value || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No channel data available</div>
            )}
          </CardContent>
        </Card>

        {/* Device Distribution Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-600" />
              Device Breakdown
            </CardTitle>
            <CardDescription className="text-slate-500">Sessions by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {devices.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceChartData} layout="vertical">
                    <XAxis type="number" tickFormatter={formatNumber} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip
                      formatter={(value: number) => [formatNumber(value), 'Sessions']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {deviceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No device data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Countries */}
      {
        geo.length > 0 && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                Top Countries
              </CardTitle>
              <CardDescription className="text-slate-500">
                Geographic distribution of your audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {geo.slice(0, 12).map((country, index) => {
                  const code = getCountryCode(country.country);
                  return (
                    <motion.div
                      key={country.country}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-2xl">
                        <ReactCountryFlag countryCode={code} svg />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{country.country}</p>
                        <p className="text-xs text-slate-500">{formatNumber(country.sessions || country.activeUsers || 0)} sessions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatNumber(country.totalUsers || 0)}</p>
                        <p className="text-xs text-slate-500">users</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Top Landing Pages */}
      {
        landingPages.length > 0 && (
          <Card className="bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-cyan-600" />
                Top Landing Pages
              </CardTitle>
              <CardDescription className="text-slate-500">
                Most visited entry points to your site
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Page</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sessions</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Users</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Bounce Rate</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {landingPages.slice(0, 10).map((page, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-cyan-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 max-w-md truncate" title={page.landingPage || page.pagePath}>
                            {page.landingPage || page.pagePath || '(not set)'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                          {formatNumber(page.sessions || 0)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-700">
                          {formatNumber(page.totalUsers || 0)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-700">
                          {(page.bounceRate || 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-700">
                          {formatDuration(page.averageSessionDuration || 0)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      }

      {
        showConnectModal && projectId && (
          <ConnectGoogleAnalytics
            projectId={projectId}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )
      }
    </motion.section >
  );
};

export default GoogleAnalyticsPage;
