import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Instagram as InstagramIcon,
  Link2,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Link,
  UserPlus,
  TrendingUp,
  RefreshCw,
  Globe,
  MapPin,
  BarChart3
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ReactCountryFlag from "react-country-flag";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ReconnectButton from "@/components/common/ReconnectButton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectInstagram from "@/components/projects/ConnectInstagram";
import api from "@/lib/api";
import type { Project, InstagramInsights } from "@/types";

const COLORS = ['#E1306C', '#F77737', '#FCAF45', '#833AB4', '#405DE6', '#5851DB'];

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const countryCodeMap: Record<string, string> = {
  "US": "US", "IN": "IN", "GB": "GB", "CA": "CA", "AU": "AU",
  "DE": "DE", "FR": "FR", "BR": "BR", "JP": "JP", "MX": "MX",
};

const InstagramPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [insights, setInsights] = useState<InstagramInsights | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

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

  const fetchInstagramData = useCallback(async () => {
    if (!projectId || !project?.instagram?.igUserId) return;

    setLoadingData(true);
    setDataError(null);

    try {
      const { data } = await api.get<{ success: boolean; data: InstagramInsights }>(
        `/instagram/insights/${projectId}`
      );
      if (data.success) {
        setInsights(data.data);
      }
    } catch (err: any) {
      setDataError(err.response?.data?.error || "Failed to load Instagram insights");
    } finally {
      setLoadingData(false);
    }
  }, [projectId, project?.instagram?.igUserId]);

  useEffect(() => {
    void fetchInstagramData();
  }, [fetchInstagramData]);

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

  if (!project.instagram?.igUserId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Instagram Insights</h1>
          <p className="text-sm text-slate-500">Connect your business account</p>
        </div>
        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl">
                <InstagramIcon className="h-8 w-8 text-pink-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Instagram Business</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your account to view profile insights and engagement metrics.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Instagram
            </Button>
          </CardContent>
        </Card>
        {showConnectModal && projectId && (
          <ConnectInstagram
            projectId={projectId}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  // Prepare audience data for charts
  const cityChartData = insights?.audience?.city?.slice(0, 5).map((item, i) => ({
    name: item.value,
    value: item.count,
    color: COLORS[i % COLORS.length]
  })) || [];



  return (
    <motion.section
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-2xl shadow-lg shadow-pink-500/25">
            <InstagramIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Instagram Insights</h1>
            <p className="text-sm text-slate-500">
              @{project.instagram?.igUsername} • ID: {project.instagram?.igUserId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="instagram"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
          />
          <Button variant="outline" onClick={fetchInstagramData} disabled={loadingData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data */}
      {loadingData && !insights ? (
        <LoadingState message="Loading insights..." />
      ) : dataError ? (
        <ErrorState description={dataError} onRetry={fetchInstagramData} />
      ) : insights ? (
        <>
          {/* Lifetime Metrics */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-pink-600" />
              Lifetime Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-100 text-sm font-medium">Reach</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(insights?.lifetime?.reach)}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Eye className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Followers</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(insights?.lifetime?.follower_count)}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Users className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-sm font-medium">Profile Views</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(insights?.lifetime?.profile_views)}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <UserPlus className="h-6 w-6" />
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
                        <p className="text-amber-100 text-sm font-medium">Website Clicks</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(insights?.lifetime?.website_clicks)}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Link className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">Likes</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights?.lifetime?.likes)}</p>
                      </div>
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Heart className="h-4 w-4 text-red-500" />
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
                        <p className="text-slate-500 text-sm font-medium">Comments</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights?.lifetime?.comments)}</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
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
                        <p className="text-slate-500 text-sm font-medium">Shares</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights?.lifetime?.shares)}</p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Share2 className="h-4 w-4 text-green-500" />
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
                        <p className="text-slate-500 text-sm font-medium">Saves</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights?.lifetime?.saves)}</p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Bookmark className="h-4 w-4 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">Total Interactions</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights?.lifetime?.total_interactions)}</p>
                      </div>
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-pink-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* 28 Days Metrics */}
          {insights?.days_28 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Last 28 Days
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <p className="text-slate-500 text-sm font-medium">Reach</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights.days_28.reach)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <p className="text-slate-500 text-sm font-medium">Profile Views</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights.days_28.profile_views)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <p className="text-slate-500 text-sm font-medium">Accounts Engaged</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights.days_28.accounts_engaged)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <p className="text-slate-500 text-sm font-medium">Interactions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(insights.days_28.total_interactions)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Audience Demographics */}
          {insights?.audience && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Cities */}
              {insights.audience.city && insights.audience.city.length > 0 && (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-pink-600" />
                      Top Cities
                    </CardTitle>
                    <CardDescription className="text-slate-500">Where your audience is from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-8">
                      <div className="w-40 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={cityChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              dataKey="value"
                              paddingAngle={3}
                            >
                              {cityChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [formatNumber(value), 'Followers']}
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {insights.audience.city.slice(0, 5).map((item, index) => (
                          <div key={item.value} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="flex-1 text-sm font-medium text-slate-700">{item.value}</span>
                            <span className="text-sm font-bold text-slate-900">{formatNumber(item.count)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Countries */}
              {insights.audience.country && insights.audience.country.length > 0 && (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-indigo-600" />
                      Top Countries
                    </CardTitle>
                    <CardDescription className="text-slate-500">Country distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.audience.country.slice(0, 8).map((item, index) => {
                        const code = countryCodeMap[item.value] || item.value.slice(0, 2).toUpperCase();
                        const total = insights.audience?.country?.reduce((a, b) => a + b.count, 0) || 1;
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <motion.div
                            key={item.value}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-3">
                              <ReactCountryFlag countryCode={code} svg className="text-xl" />
                              <span className="flex-1 text-sm font-medium text-slate-700">{item.value}</span>
                              <span className="text-sm font-bold text-slate-900">{formatNumber(item.count)}</span>
                              <span className="text-xs text-slate-500">{percentage}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`
                                }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Account Info */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
                    <InstagramIcon className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Connected Account</p>
                    <p className="font-medium text-slate-900">@{project.instagram?.igUsername}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowConnectModal(true)}>
                  Change Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState title="No data available" description="Unable to load Instagram insights data." />
      )}

      {showConnectModal && (
        <ConnectInstagram
          projectId={projectId!}
          onSuccess={handleConnectSuccess}
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </motion.section>
  );
};

export default InstagramPage;
