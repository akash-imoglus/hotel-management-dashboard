import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Link2,
  TrendingUp,
  MousePointer,
  DollarSign,
  Target,
  Percent,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Search,
  Sparkles,
  BarChart3,
  Eye,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import ReactCountryFlag from "react-country-flag";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ReconnectButton from "@/components/common/ReconnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ConnectGoogleAds from "@/components/projects/ConnectGoogleAds";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import type { DateRange, Project } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

interface GoogleAdsOverviewMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  costPerConversion: number;
  averageCpm?: number;
  conversionRate?: number;
  interactions?: number;
  interactionRate?: number;
}

interface LocationData {
  country: string;
  countryCode: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
}

interface DeviceData {
  device: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  conversionRate?: number;
  costPerConversion?: number;
}

interface KeywordData {
  id: string;
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  conversionRate: number;
  costPerConversion: number;
  qualityScore?: number;
}

// Device icon mapping
const getDeviceIcon = (device: string) => {
  const d = device.toLowerCase();
  if (d.includes("mobile")) return Smartphone;
  if (d.includes("tablet")) return Tablet;
  if (d.includes("desktop") || d.includes("computer")) return Monitor;
  return Monitor;
};

// Color palette for charts
const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};



const GoogleAdsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<GoogleAdsOverviewMetrics | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adsErrors, setAdsErrors] = useState<Record<string, string | null>>({
    overview: null,
    locations: null,
    devices: null,
    campaigns: null,
    keywords: null,
  });

  const [rangePreset, setRangePreset] = useState<DateRangePreset>("7d");
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [activeRange, setActiveRange] = useState<DateRange>(() => buildDateRange("7d"));
  const [searchQuery, setSearchQuery] = useState("");

  const formatCurrency = (num: number) => {
    const currency = project?.googleAdsCurrency || 'INR';
    return formatCurrencyUtil(num, currency);
  };

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

  const fetchAdsData = useCallback(async () => {
    if (!projectId || !project?.googleAdsCustomerId) return;

    setLoadingAds(true);
    setAdsErrors({
      overview: null,
      locations: null,
      devices: null,
      campaigns: null,
      keywords: null,
    });

    try {
      const overviewRes = await api.get<{ success: boolean; data: GoogleAdsOverviewMetrics }>(
        `/google-ads/${projectId}/overview`,
        params
      );
      setOverview(overviewRes.data.data);
    } catch (error: any) {
      setAdsErrors((prev) => ({
        ...prev,
        overview: error.response?.data?.error || error.message,
      }));
    }

    try {
      const locationsRes = await api.get<{ success: boolean; data: LocationData[] }>(
        `/google-ads/${projectId}/locations`,
        params
      );
      setLocations(locationsRes.data.data || []);
    } catch (error: any) {
      setAdsErrors((prev) => ({
        ...prev,
        locations: error.response?.data?.error || error.message,
      }));
    }

    try {
      const devicesRes = await api.get<{ success: boolean; data: DeviceData[] }>(
        `/google-ads/${projectId}/devices`,
        params
      );
      setDevices(devicesRes.data.data || []);
    } catch (error: any) {
      setAdsErrors((prev) => ({
        ...prev,
        devices: error.response?.data?.error || error.message,
      }));
    }

    try {
      const campaignsRes = await api.get<{ success: boolean; data: Campaign[] }>(
        `/google-ads/${projectId}/campaigns`,
        params
      );
      setCampaigns(campaignsRes.data.data || []);
    } catch (error: any) {
      setAdsErrors((prev) => ({
        ...prev,
        campaigns: error.response?.data?.error || error.message,
      }));
    }

    try {
      const keywordsRes = await api.get<{ success: boolean; data: KeywordData[] }>(
        `/google-ads/${projectId}/keywords`,
        params
      );
      setKeywords(keywordsRes.data.data || []);
    } catch (error: any) {
      setAdsErrors((prev) => ({
        ...prev,
        keywords: error.response?.data?.error || error.message,
      }));
    }

    setLoadingAds(false);
  }, [projectId, project?.googleAdsCustomerId, params]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project?.googleAdsCustomerId) {
      void fetchAdsData();
    }
  }, [fetchAdsData, project?.googleAdsCustomerId]);

  const handleConnectSuccess = async () => {
    setShowConnectModal(false);
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchProject();
  };

  // Filter campaigns by search
  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter keywords by search
  const filteredKeywords = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!projectId) {
    return (
      <EmptyState
        title="No project selected"
        description="Choose a project from your list to view Google Ads data."
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

  if (project && !project.googleAdsCustomerId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Google Ads</h1>
          <p className="text-sm text-slate-500">Connect your advertising account</p>
        </div>
        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Google Ads</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your account to view campaign performance, metrics, and insights.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Google Ads
            </Button>
          </CardContent>
        </Card>
        {showConnectModal && projectId && (
          <ConnectGoogleAds
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
    void fetchAdsData();
  };

  // Prepare device chart data
  const deviceChartData = devices.map((d, i) => ({
    name: d.device,
    value: d.clicks,
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
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Google Ads</h1>
            <p className="text-sm text-slate-500">
              Performance data from {activeRange.startDate} to {activeRange.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="google-ads"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
          />
          <Button variant="outline" onClick={handleRefresh} disabled={loadingAds}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingAds ? 'animate-spin' : ''}`} />
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
        disabled={loadingAds}
      />

      {/* Overview Cards */}
      {adsErrors.overview && adsErrors.overview.includes('Test Mode') && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-2">Developer Token in Test Mode</h3>
                <div className="text-sm text-amber-800 space-y-2">
                  <p>Your Google Ads developer token can only access <strong>TEST accounts</strong>, not regular Google Ads accounts.</p>
                  <p className="font-medium">To fix this, choose one option:</p>
                  <div className="ml-4 space-y-1">
                    <p><strong>Option 1:</strong> Create a TEST Manager Account (for development)</p>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Visit <a href="https://ads.google.com/aw/overview" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">Google Ads <ExternalLink className="h-3 w-3" /></a> (use a separate Google account)</li>
                      <li>Click the blue button "Create a test manager account"</li>
                      <li>Create test client accounts under this test manager</li>
                      <li>Use the TEST client customer ID (shows "Test account" label in red)</li>
                    </ol>
                    <p className="mt-2"><strong>Option 2:</strong> Apply for Standard Access (for production)</p>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Visit <a href="https://ads.google.com/aw/apicenter" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">API Center <ExternalLink className="h-3 w-3" /></a></li>
                      <li>Apply for Standard Access (takes 1-2 business days)</li>
                      <li>Use with regular Google Ads accounts after approval</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {loadingAds && !overview ? (
        <LoadingState message="Loading ads data..." />
      ) : adsErrors.overview && !overview ? (
        <ErrorState description={adsErrors.overview} onRetry={handleRefresh} />
      ) : overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Impressions</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.impressions)}</p>
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
                    <p className="text-cyan-100 text-sm font-medium">Clicks</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.clicks)}</p>
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
                    <p className="text-emerald-100 text-sm font-medium">Cost</p>
                    <p className="text-3xl font-bold mt-1">{formatCurrency(overview.cost)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Conversions</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.conversions)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Target className="h-6 w-6" />
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
                    <p className="text-slate-500 text-sm font-medium">CTR</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{overview.ctr.toFixed(2)}%</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Percent className="h-5 w-5 text-indigo-600" />
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
                    <p className="text-slate-500 text-sm font-medium">Avg CPC</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(overview.averageCpc)}</p>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-xl">
                    <DollarSign className="h-5 w-5 text-cyan-600" />
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
                    <p className="text-slate-500 text-sm font-medium">Conv Rate</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {overview.conversionRate?.toFixed(2) || '0.00'}%
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
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
                    <p className="text-slate-500 text-sm font-medium">Cost/Conv</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(overview.costPerConversion)}</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Target className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* Devices & Locations Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Devices Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-600" />
              Performance by Device
            </CardTitle>
            <CardDescription className="text-slate-500">Click distribution across devices</CardDescription>
          </CardHeader>
          <CardContent>
            {devices.length > 0 ? (
              <div className="flex items-center gap-8">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {deviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatNumber(value), 'Clicks']}
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
                <div className="flex-1 space-y-3">
                  {devices.map((device, index) => {
                    const Icon = getDeviceIcon(device.device);
                    return (
                      <div key={device.device} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span className="flex-1 text-sm font-medium text-slate-700">{device.device}</span>
                        <span className="text-sm font-bold text-slate-900">{formatNumber(device.clicks)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No device data available</div>
            )}
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              Top Locations
            </CardTitle>
            <CardDescription className="text-slate-500">Performance by country</CardDescription>
          </CardHeader>
          <CardContent>
            {locations.length > 0 ? (
              <div className="space-y-2">
                {locations.slice(0, 8).map((loc, index) => (
                  <motion.div
                    key={loc.country}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-lg">
                      <ReactCountryFlag countryCode={loc.countryCode || 'US'} svg />
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700">{loc.country}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatNumber(loc.clicks)} clicks</p>
                      <p className="text-xs text-slate-500">{formatCurrency(loc.cost)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No location data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search campaigns or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-slate-200"
        />
      </div>

      {/* Campaigns Table */}
      {campaigns.length > 0 && (
        <Card className="bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Campaigns
            </CardTitle>
            <CardDescription className="text-slate-500">
              Performance breakdown by campaign ({filteredCampaigns.length} campaigns)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Campaign</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Impressions</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clicks</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cost</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Conv</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">CTR</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">CPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCampaigns.map((campaign, index) => (
                    <motion.tr
                      key={campaign.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-indigo-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{campaign.name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.status === 'ENABLED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : campaign.status === 'PAUSED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {formatNumber(campaign.impressions)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                        {formatNumber(campaign.clicks)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {formatCurrency(campaign.cost)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-emerald-600">
                        {formatNumber(campaign.conversions)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {campaign.ctr.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-700">
                        {formatCurrency(campaign.averageCpc)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords Table */}
      {keywords.length > 0 && (
        <Card className="bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-cyan-600" />
              Keywords
            </CardTitle>
            <CardDescription className="text-slate-500">
              Performance by keyword ({filteredKeywords.length} keywords)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Keyword</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Match</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Impr</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clicks</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cost</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">CTR</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">QS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKeywords.slice(0, 20).map((kw, index) => (
                    <motion.tr
                      key={kw.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-cyan-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{kw.keyword}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">
                          {kw.matchType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {formatNumber(kw.impressions)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                        {formatNumber(kw.clicks)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {formatCurrency(kw.cost)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {kw.ctr.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        {kw.qualityScore && (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${kw.qualityScore >= 7
                            ? 'bg-emerald-100 text-emerald-700'
                            : kw.qualityScore >= 5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            {kw.qualityScore}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingAds && !overview && !locations.length && !devices.length && !campaigns.length && !keywords.length && (
        <LoadingState message="Loading Google Ads data..." className="py-16" />
      )}
    </motion.section>
  );
};

export default GoogleAdsPage;
