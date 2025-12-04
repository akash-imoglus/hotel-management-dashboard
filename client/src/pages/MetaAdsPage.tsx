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
  RefreshCw,
  Instagram,
  Facebook as FacebookIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Minus
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ReconnectButton from "@/components/common/ReconnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectMetaAds from "@/components/projects/ConnectMetaAds";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import type { DateRange, Project, MetaAdsInsights } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

// Types for extended data
interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
}

interface DemographicBreakdown {
  age: string;
  gender: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
}

interface PlatformBreakdown {
  platform: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};



const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PLATFORM_COLORS: Record<string, string> = {
  'Facebook': '#1877F2',
  'Instagram': '#E4405F',
  'Audience Network': '#4267B2',
  'Messenger': '#00B2FF',
};



const MetaAdsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Data states
  const [insights, setInsights] = useState<MetaAdsInsights | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [demographics, setDemographics] = useState<DemographicBreakdown[]>([]);
  const [platforms, setPlatforms] = useState<PlatformBreakdown[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [rangePreset, setRangePreset] = useState<DateRangePreset>("last28days");
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [dateRange, setDateRange] = useState<DateRange>(buildDateRange("last28days"));

  const formatCurrency = (num: number) => {
    const currency = project?.metaAdsCurrency || 'INR';
    return formatCurrencyUtil(num, currency);
  };

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
      // Fetch all data in parallel
      const [insightsRes, campaignsRes, demographicsRes, platformsRes, dailyRes] = await Promise.all([
        api.get<{ success: boolean; data: MetaAdsInsights }>(`/meta-ads/insights/${projectId}`, { params }),
        api.get<{ success: boolean; data: Campaign[] }>(`/meta-ads/campaigns/${projectId}`, { params }).catch(() => ({ data: { success: true, data: [] } })),
        api.get<{ success: boolean; data: DemographicBreakdown[] }>(`/meta-ads/demographics/${projectId}`, { params }).catch(() => ({ data: { success: true, data: [] } })),
        api.get<{ success: boolean; data: PlatformBreakdown[] }>(`/meta-ads/platforms/${projectId}`, { params }).catch(() => ({ data: { success: true, data: [] } })),
        api.get<{ success: boolean; data: DailyData[] }>(`/meta-ads/daily/${projectId}`, { params }).catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (insightsRes.data.success) setInsights(insightsRes.data.data);
      if (campaignsRes.data.success) setCampaigns(campaignsRes.data.data);
      if (demographicsRes.data.success) setDemographics(demographicsRes.data.data);
      if (platformsRes.data.success) setPlatforms(platformsRes.data.data);
      if (dailyRes.data.success) setDailyData(dailyRes.data.data);
    } catch (err: any) {
      setDataError(err.response?.data?.error || "Failed to load Meta Ads insights");
    } finally {
      setLoadingData(false);
    }
  }, [projectId, project?.metaAdsAccountId, dateRange]);

  useEffect(() => {
    void fetchMetaAdsData();
  }, [fetchMetaAdsData]);

  const handleApplyRange = () => {
    const newRange = buildDateRange(rangePreset, customRange);
    setDateRange(newRange);
  };

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    void fetchProject();
  };

  // Process demographics for charts
  const ageData = demographics.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.age === item.age);
    if (existing) {
      existing.impressions += item.impressions;
      existing.spend += item.spend;
    } else {
      acc.push({ age: item.age, impressions: item.impressions, spend: item.spend });
    }
    return acc;
  }, []).sort((a, b) => {
    const ageOrder = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    return ageOrder.indexOf(a.age) - ageOrder.indexOf(b.age);
  });



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
      className="space-y-6"
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
            <h1 className="text-2xl font-bold text-slate-900">Meta Ads Performance</h1>
            <p className="text-sm text-slate-500">
              Account: {project.metaAdsAccountId} • {dateRange.startDate} to {dateRange.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="meta-ads"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
          />
          <Button variant="outline" onClick={fetchMetaAdsData} disabled={loadingData}>
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

      {loadingData && !insights ? (
        <LoadingState message="Loading ad insights..." />
      ) : dataError ? (
        <ErrorState description={dataError} onRetry={fetchMetaAdsData} />
      ) : insights ? (
        <>
          {/* Top Metrics Row - Like DM Cockpit */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-white border border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Percent className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">CTR</p>
                    <p className="text-xl font-bold text-slate-900">{insights.ctr.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Target className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Conversions</p>
                    <p className="text-xl font-bold text-slate-900">{formatNumber(insights.conversions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Impressions</p>
                    <p className="text-xl font-bold text-slate-900">{formatNumber(insights.impressions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Reach</p>
                    <p className="text-xl font-bold text-slate-900">{formatNumber(insights.reach)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Spend</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(insights.spend)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Overview - Daily Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white border border-slate-200 lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-500" />
                    <CardTitle className="text-lg text-slate-900">Account Overview</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Impressions</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Clicks</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Spend</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(v) => formatNumber(v)}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'spend') return [formatCurrency(value), 'Spend'];
                          return [formatNumber(value), name.charAt(0).toUpperCase() + name.slice(1)];
                        }}
                        labelFormatter={formatDate}
                      />
                      <Bar yAxisId="left" dataKey="impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="spend" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    No daily data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audience Demographics */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-lg text-slate-900">Audience Demographics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {ageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ageData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatNumber(v)} />
                      <YAxis dataKey="age" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={50} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: any) => [formatNumber(value), 'Impressions']}
                      />
                      <Bar dataKey="impressions" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    No demographic data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platform & Campaign Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Breakdown */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-lg text-slate-900">Platform Demographics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {platforms.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={platforms as any}
                          dataKey="impressions"
                          nameKey="platform"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {platforms.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PLATFORM_COLORS[entry.platform] || '#6B7280'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value: any) => [formatNumber(value), 'Impressions']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {platforms.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: PLATFORM_COLORS[p.platform] || '#6B7280' }}
                            ></span>
                            <span className="text-sm text-slate-700">{p.platform}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">{formatNumber(p.impressions)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    No platform data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Overview */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-lg text-slate-900">Campaign Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={campaigns.slice(0, 5)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: any) => [formatNumber(value), 'Impressions']}
                      />
                      <Bar dataKey="impressions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    No campaign data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium uppercase">Clicks</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(insights.clicks)}</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium uppercase">CPC</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(insights.cpc)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-xs font-medium uppercase">CPM</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(insights.cpm)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-medium uppercase">Frequency</p>
                    <p className="text-2xl font-bold mt-1">{insights.frequency?.toFixed(2) || '0.00'}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table - Like DM Cockpit Summary */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">Campaign Summary</CardTitle>
                <span className="text-xs text-slate-500">{campaigns.length} campaigns</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Campaign Name</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Reach</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Impressions</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Amount Spent</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Clicks</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length > 0 ? campaigns.map((campaign, index) => (
                      <tr key={campaign.id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${campaign.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : campaign.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                            }`}>
                            {campaign.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>}
                            {campaign.status === 'PAUSED' && <Minus className="w-3 h-3 mr-1" />}
                            {campaign.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 max-w-[200px] truncate" title={campaign.name}>
                            {campaign.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatNumber(campaign.reach)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatNumber(campaign.impressions)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(campaign.spend)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatNumber(campaign.clicks)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(campaign.cpc)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No campaign data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="bg-white border border-slate-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                    <div className="flex items-center">
                      <FacebookIcon className="h-4 w-4 text-blue-600" />
                      <Instagram className="h-4 w-4 text-pink-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Connected Account</p>
                    <p className="font-mono text-sm text-slate-900">{project.metaAdsAccountId}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowConnectModal(true)}>
                  Change Account
                </Button>
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
