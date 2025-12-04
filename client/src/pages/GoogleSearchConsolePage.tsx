import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Link2,
  Search,
  Globe,
  FileText,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  MousePointer,
  Eye,
  Target,
  RefreshCw
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ReactCountryFlag from "react-country-flag";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ReconnectButton from "@/components/common/ReconnectButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectGoogleSearchConsole from "@/components/projects/ConnectGoogleSearchConsole";
import api from "@/lib/api";
import { buildDateRange } from "@/lib/utils";
import type { DateRange, Project, SearchConsoleOverview, SearchConsoleQuery, SearchConsolePage, SearchConsoleCountry, SearchConsoleDevice } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

// Color palette for charts
const COLORS = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

// Safe number formatting helpers
const safeToFixed = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};

// Country code mapping
const countryCodeMap: Record<string, string> = {
  "usa": "US", "united states": "US", "ind": "IN", "india": "IN",
  "gbr": "GB", "united kingdom": "GB", "can": "CA", "canada": "CA",
  "aus": "AU", "australia": "AU", "deu": "DE", "germany": "DE",
  "fra": "FR", "france": "FR", "bra": "BR", "brazil": "BR",
  "jpn": "JP", "japan": "JP", "mex": "MX", "mexico": "MX",
};

const getCountryCode = (country: string) => {
  const lower = country.toLowerCase();
  return countryCodeMap[lower] || country.slice(0, 2).toUpperCase();
};

const getDeviceIcon = (device: string) => {
  const d = device.toLowerCase();
  if (d.includes("mobile")) return Smartphone;
  if (d.includes("tablet")) return Tablet;
  return Monitor;
};

const GoogleSearchConsolePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<SearchConsoleOverview | null>(null);
  const [queries, setQueries] = useState<SearchConsoleQuery[]>([]);
  const [pages, setPages] = useState<SearchConsolePage[]>([]);
  const [countries, setCountries] = useState<SearchConsoleCountry[]>([]);
  const [devices, setDevices] = useState<SearchConsoleDevice[]>([]);
  const [loadingData, setLoadingData] = useState(true);


  const [rangePreset, setRangePreset] = useState<DateRangePreset>("last28days");
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [dateRange, setDateRange] = useState<DateRange>(buildDateRange("last28days"));
  const [querySearch, setQuerySearch] = useState<string>("");
  const [pageSearch, setPageSearch] = useState<string>("");

  const filteredQueries = useMemo(() => {
    if (!querySearch.trim()) return queries;
    const search = querySearch.toLowerCase().trim();
    return queries.filter((q) => q.query.toLowerCase().includes(search));
  }, [queries, querySearch]);

  const filteredPages = useMemo(() => {
    if (!pageSearch.trim()) return pages;
    const search = pageSearch.toLowerCase().trim();
    return pages.filter((p) => p.page.toLowerCase().includes(search));
  }, [pages, pageSearch]);

  useEffect(() => {
    const fetchProject = async () => {
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
    };
    void fetchProject();
  }, [projectId]);

  const fetchSearchConsoleData = useCallback(async () => {
    if (!projectId || !project?.searchConsoleSiteUrl) return;

    const params = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };

    setLoadingData(true);


    try {
      const { data } = await api.get<{ success: boolean; data: SearchConsoleOverview }>(
        `/gsc/${projectId}/overview`,
        { params }
      );
      if (data.success) setOverview(data.data);
    } catch (err: any) {
      console.error(err);
    }

    try {
      const { data } = await api.get<{ success: boolean; data: SearchConsoleQuery[] }>(
        `/gsc/${projectId}/queries`,
        { params }
      );
      if (data.success) setQueries(data.data);
    } catch (err: any) {
      console.error(err);
    }

    try {
      const { data } = await api.get<{ success: boolean; data: SearchConsolePage[] }>(
        `/gsc/${projectId}/pages`,
        { params }
      );
      if (data.success) setPages(data.data);
    } catch (err: any) {
      console.error(err);
    }

    try {
      const { data } = await api.get<{ success: boolean; data: SearchConsoleCountry[] }>(
        `/gsc/${projectId}/countries`,
        { params }
      );
      if (data.success) setCountries(data.data);
    } catch (err: any) {
      console.error(err);
    }

    try {
      const { data } = await api.get<{ success: boolean; data: SearchConsoleDevice[] }>(
        `/gsc/${projectId}/devices`,
        { params }
      );
      if (data.success) setDevices(data.data);
    } catch (err: any) {
      console.error(err);
    }

    setLoadingData(false);
  }, [projectId, project?.searchConsoleSiteUrl, dateRange]);

  useEffect(() => {
    void fetchSearchConsoleData();
  }, [fetchSearchConsoleData]);

  const handleApplyRange = () => {
    const newRange = buildDateRange(rangePreset, customRange);
    setDateRange(newRange);
  };

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    if (projectId) {
      api.get<{ success: boolean; data: Project }>(`/projects/${projectId}`).then(({ data }) => {
        if (data.success) setProject(data.data);
      });
    }
  };

  if (loadingProject) {
    return <LoadingState message="Loading project..." className="py-16" />;
  }

  if (projectError || !project) {
    return <ErrorState description={projectError || "Project not found"} className="py-16" />;
  }

  if (!project.searchConsoleSiteUrl) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Google Search Console</h1>
          <p className="text-sm text-slate-500">Connect to view search performance data</p>
        </div>
        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Search className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Search Console</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your site to view search queries, rankings, and SEO insights.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Search Console
            </Button>
          </CardContent>
        </Card>
        {showConnectModal && projectId && (
          <ConnectGoogleSearchConsole
            projectId={projectId}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  // Device chart data
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
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25">
            <Search className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Search Console</h1>
            <p className="text-sm text-slate-500">
              {project.searchConsoleSiteUrl} • {dateRange.startDate} to {dateRange.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="google-search-console"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
          />
          <Button variant="outline" onClick={fetchSearchConsoleData} disabled={loadingData}>
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

      {/* Overview Cards */}
      {loadingData && !overview ? (
        <LoadingState message="Loading search data..." />
      ) : overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Clicks</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.clicks)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <MousePointer className="h-6 w-6" />
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
                    <p className="text-cyan-100 text-sm font-medium">Impressions</p>
                    <p className="text-3xl font-bold mt-1">{formatNumber(overview.impressions)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Eye className="h-6 w-6" />
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
                    <p className="text-violet-100 text-sm font-medium">CTR</p>
                    <p className="text-3xl font-bold mt-1">{safeToFixed(overview.ctr, 2)}%</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Avg Position</p>
                    <p className="text-3xl font-bold mt-1">{safeToFixed(overview.position, 1)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Target className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* Devices & Countries Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Devices Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-emerald-600" />
              Traffic by Device
            </CardTitle>
            <CardDescription className="text-slate-500">Click distribution across devices</CardDescription>
          </CardHeader>
          <CardContent>
            {devices.length > 0 ? (
              <div className="flex items-center gap-8">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        dataKey="value"
                        paddingAngle={3}
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

        {/* Countries */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-600" />
              Top Countries
            </CardTitle>
            <CardDescription className="text-slate-500">Search traffic by country</CardDescription>
          </CardHeader>
          <CardContent>
            {countries.length > 0 ? (
              <div className="space-y-2">
                {countries.slice(0, 8).map((country, index) => (
                  <motion.div
                    key={country.country}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-lg">
                      <ReactCountryFlag countryCode={getCountryCode(country.country)} svg />
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700">{country.country}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatNumber(country.clicks)} clicks</p>
                      <p className="text-xs text-slate-500">Pos: {safeToFixed(country.position, 1)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No country data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Queries */}
      <Card className="bg-white overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-600" />
                Top Search Queries
              </CardTitle>
              <CardDescription className="text-slate-500">
                Most popular search queries ({filteredQueries.length} queries)
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search queries..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {queries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Query</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clicks</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Impressions</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">CTR</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueries.slice(0, 25).map((query, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 max-w-md truncate">{query.query}</p>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-emerald-600">
                        {formatNumber(query.clicks)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {formatNumber(query.impressions)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {safeToFixed(query.ctr, 2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center justify-center w-10 h-7 rounded-full text-sm font-bold ${(Number(query.position) || 0) <= 3
                            ? 'bg-emerald-100 text-emerald-700'
                            : (Number(query.position) || 0) <= 10
                              ? 'bg-cyan-100 text-cyan-700'
                              : (Number(query.position) || 0) <= 20
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                          {safeToFixed(query.position, 1)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No query data available</div>
          )}
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card className="bg-white overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Top Pages
              </CardTitle>
              <CardDescription className="text-slate-500">
                Pages with the most search traffic ({filteredPages.length} pages)
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search pages..."
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Page URL</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clicks</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Impressions</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">CTR</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPages.slice(0, 25).map((page, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-amber-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 max-w-lg truncate" title={page.page}>
                          {page.page}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-emerald-600">
                        {formatNumber(page.clicks)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {formatNumber(page.impressions)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {safeToFixed(page.ctr, 2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center justify-center w-10 h-7 rounded-full text-sm font-bold ${(Number(page.position) || 0) <= 3
                            ? 'bg-emerald-100 text-emerald-700'
                            : (Number(page.position) || 0) <= 10
                              ? 'bg-cyan-100 text-cyan-700'
                              : (Number(page.position) || 0) <= 20
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                          {safeToFixed(page.position, 1)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No page data available</div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default GoogleSearchConsolePage;
