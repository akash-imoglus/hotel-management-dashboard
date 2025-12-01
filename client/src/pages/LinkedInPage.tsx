import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Linkedin, 
  Users, 
  Eye, 
  ThumbsUp,
  MessageCircle,
  Share2,
  TrendingUp,
  Building2,
  Briefcase
} from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ReconnectButton from "@/components/common/ReconnectButton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectLinkedIn from "@/components/projects/ConnectLinkedIn";
import api from "@/lib/api";
import type { Project } from "@/types";

interface LinkedInOverviewMetrics {
  followers: number;
  connections?: number;
  profileViews?: number;
  postImpressions?: number;
  postEngagements?: number;
  uniqueVisitors?: number;
}

interface LinkedInPostData {
  id: string;
  text: string;
  publishedAt: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
}

const LinkedInPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [overview, setOverview] = useState<LinkedInOverviewMetrics | null>(null);
  const [posts, setPosts] = useState<LinkedInPostData[]>([]);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(true);
  const [linkedinErrors, setLinkedInErrors] = useState<Record<string, string | null>>({
    overview: null,
    posts: null,
  });

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

  const fetchLinkedInData = useCallback(async () => {
    if (!projectId || !project?.linkedinPageId) return;
    
    setLoadingLinkedIn(true);
    setLinkedInErrors({
      overview: null,
      posts: null,
    });

    // Fetch overview metrics
    try {
      const overviewRes = await api.get<{ success: boolean; data: LinkedInOverviewMetrics }>(
        `/linkedin/${projectId}/overview`
      );
      setOverview(overviewRes.data.data);
    } catch (error: any) {
      setLinkedInErrors((prev) => ({
        ...prev,
        overview: error.response?.data?.error || error.message,
      }));
    }

    // Fetch posts
    try {
      const postsRes = await api.get<{ success: boolean; data: LinkedInPostData[] }>(
        `/linkedin/${projectId}/posts`
      );
      setPosts(postsRes.data.data || []);
    } catch (error: any) {
      setLinkedInErrors((prev) => ({
        ...prev,
        posts: error.response?.data?.error || error.message,
      }));
    }

    setLoadingLinkedIn(false);
  }, [projectId, project?.linkedinPageId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project) {
      void fetchLinkedInData();
    }
  }, [fetchLinkedInData, project]);

  const handleRefresh = () => {
    void fetchLinkedInData();
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

  if (!project.linkedinPageId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">LinkedIn Analytics</h1>
          <p className="text-sm text-slate-500">Connect your LinkedIn page to view analytics</p>
        </div>

        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#0A66C2]/10 rounded-xl">
                <Linkedin className="h-8 w-8 text-[#0A66C2]" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect LinkedIn</CardTitle>
                <CardDescription className="text-slate-500">
                  Link your LinkedIn page to view engagement metrics, follower insights, and post performance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowConnectModal(true)}
              className="bg-[#0A66C2] hover:bg-[#004182]"
            >
              <Linkedin className="mr-2 h-4 w-4" />
              Connect LinkedIn Page
            </Button>
          </CardContent>
        </Card>

        {showConnectModal && (
          <ConnectLinkedIn
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
          <div className="p-3 bg-gradient-to-br from-[#0A66C2] to-[#004182] rounded-2xl shadow-lg shadow-[#0A66C2]/25">
            <Linkedin className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">LinkedIn Analytics</h1>
            <p className="text-sm text-slate-500">
              Page insights and engagement metrics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="linkedin"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
          />
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loadingLinkedIn}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Refresh data
          </Button>
        </div>
      </motion.div>

      {/* Overview Cards */}
      {loadingLinkedIn ? (
        <LoadingState message="Loading LinkedIn metrics..." />
      ) : linkedinErrors.overview ? (
        <motion.div variants={itemVariants} className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
              <p className="text-sm text-red-800 mb-4">{linkedinErrors.overview}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                Retry
              </Button>
            </div>
          </div>
        </motion.div>
      ) : overview ? (
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Followers Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#004182] p-6 text-white shadow-lg shadow-[#0A66C2]/25">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-blue-100">Followers</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(overview.followers)}</div>
            </div>
          </div>

          {/* Profile Views Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg shadow-emerald-500/25">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-emerald-100">Profile Views</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(overview.profileViews || 0)}</div>
            </div>
          </div>

          {/* Impressions Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg shadow-purple-500/25">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-purple-100">Post Impressions</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(overview.postImpressions || 0)}</div>
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
                  <p className="text-sm text-slate-500">Post Engagements</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(overview.postEngagements || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Connections</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(overview.connections || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Unique Visitors</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(overview.uniqueVisitors || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Posts */}
      {posts.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white border-slate-200 overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0A66C2]/10 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-[#0A66C2]" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Recent Posts</CardTitle>
                  <CardDescription className="text-slate-500">Your latest LinkedIn posts and their performance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {posts.map((post, index) => (
                  <motion.div 
                    key={post.id} 
                    className="p-4 hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <p className="text-sm text-slate-900 mb-3 line-clamp-2">{post.text}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">{formatNumber(post.impressions)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="font-medium">{formatNumber(post.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MessageCircle className="h-4 w-4" />
                        <span className="font-medium">{formatNumber(post.comments)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Share2 className="h-4 w-4" />
                        <span className="font-medium">{formatNumber(post.shares)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Card for Limited API Access */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Linkedin className="h-6 w-6 text-[#0A66C2]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">LinkedIn API Information</h3>
                <p className="text-sm text-slate-600">
                  LinkedIn's Marketing API requires special approval for full analytics access. 
                  Currently showing basic profile information. For complete page analytics including 
                  follower demographics, post performance, and visitor insights, your LinkedIn 
                  Developer App needs Marketing Developer Platform access approval.
                </p>
                <a 
                  href="https://www.linkedin.com/developers/apps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm font-medium text-[#0A66C2] hover:underline"
                >
                  Learn more about LinkedIn Marketing API →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.section>
  );
};

export default LinkedInPage;

