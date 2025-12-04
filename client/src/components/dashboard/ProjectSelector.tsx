import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import {
  ChevronDown,
  Search,
  Plus,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Facebook,
  Megaphone,
  Instagram,
  Youtube,
  FileSpreadsheet,
  HardDrive,
  Linkedin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Link2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { Project } from "@/types";
import LoadingState from "@/components/common/LoadingState";
import ConnectGoogleAds from "@/components/projects/ConnectGoogleAds";
import ConnectMetaAds from "@/components/projects/ConnectMetaAds";
import ConnectGoogleAnalytics from "@/components/projects/ConnectGoogleAnalytics";
import ConnectGoogleSearchConsole from "@/components/projects/ConnectGoogleSearchConsole";
import ConnectYouTube from "@/components/projects/ConnectYouTube";
import ConnectFacebook from "@/components/projects/ConnectFacebook";
import ConnectInstagram from "@/components/projects/ConnectInstagram";
import ConnectGoogleSheets from "@/components/projects/ConnectGoogleSheets";
import ConnectGoogleDrive from "@/components/projects/ConnectGoogleDrive";
import ConnectLinkedIn from "@/components/projects/ConnectLinkedIn";
import ConnectGoogleBusinessProfile from "@/components/projects/ConnectGoogleBusinessProfile";

const ProjectSelector = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConnectGAModal, setShowConnectGAModal] = useState(false);
  const [showConnectAdsModal, setShowConnectAdsModal] = useState(false);
  const [showConnectSearchConsoleModal, setShowConnectSearchConsoleModal] = useState(false);
  const [showConnectYouTubeModal, setShowConnectYouTubeModal] = useState(false);
  const [showConnectFacebookModal, setShowConnectFacebookModal] = useState(false);
  const [showConnectMetaAdsModal, setShowConnectMetaAdsModal] = useState(false);
  const [showConnectInstagramModal, setShowConnectInstagramModal] = useState(false);
  const [showConnectGoogleSheetsModal, setShowConnectGoogleSheetsModal] = useState(false);
  const [showConnectGoogleDriveModal, setShowConnectGoogleDriveModal] = useState(false);
  const [showConnectLinkedInModal, setShowConnectLinkedInModal] = useState(false);
  const [showConnectGBPModal, setShowConnectGBPModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: Project[] }>("/projects");
      const projectsData = response.data.data || response.data;
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      if (projectId) {
        const project = projectsData.find(
          (p: Project) => (p.id ?? p._id) === projectId
        );
        if (project) {
          setSelectedProject(project);
        }
      } else if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleConnectSuccess = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSelect = (project: Project) => {
    const id = project.id ?? project._id;
    if (id) {
      setSelectedProject(project);
      navigate(`/dashboard/${id}`);
    }
  };

  const displayName = selectedProject?.name || "Select Project";
  const truncatedName = displayName.length > 20
    ? `${displayName.substring(0, 20)}...`
    : displayName;

  return (
    <>
      <div
        className={cn(
          "flex-shrink-0 border-r border-slate-200 flex flex-col h-full overflow-hidden relative transition-all duration-300 bg-white",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 z-20 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-slate-200 text-slate-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 shadow-sm"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Project Selector Header */}
        {!isCollapsed ? (
          <div className="h-16 flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 h-10 text-sm font-semibold hover:bg-slate-100 rounded-xl"
                >
                  <span className="truncate flex-1 text-left text-slate-900">{truncatedName}</span>
                  <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 z-[100] bg-white border-slate-200 shadow-xl rounded-xl p-1"
              >
                {/* Search Bar */}
                <div className="px-2 py-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-slate-100" />

                {/* Projects List */}
                <div className="max-h-64 overflow-y-auto py-1">
                  {loading ? (
                    <div className="px-2 py-4">
                      <LoadingState message="Loading..." className="py-2" />
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-center text-slate-500">
                      {searchQuery ? "No projects found" : "No projects"}
                    </div>
                  ) : (
                    filteredProjects.map((project) => {
                      const id = project.id ?? project._id;
                      const isSelected = id === projectId;
                      return (
                        <DropdownMenuItem
                          key={id}
                          onClick={() => handleProjectSelect(project)}
                          className={cn(
                            "mx-1 rounded-lg cursor-pointer transition-colors",
                            isSelected
                              ? "bg-red-50 text-red-600"
                              : "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <span className="truncate">{project.name}</span>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>

                <DropdownMenuSeparator className="bg-slate-100" />

                {/* Add Project Button */}
                <DropdownMenuItem
                  onClick={() => navigate("/projects/new")}
                  className="mx-1 rounded-lg text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center border-b border-slate-200 bg-slate-50/50">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20"
              title={selectedProject?.name || "No Project"}
            >
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        {/* Project Info */}
        {selectedProject && !isCollapsed && (
          <>
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs font-medium text-slate-500">Website</p>
              </div>
              <p className="text-xs text-slate-700 truncate font-medium">{selectedProject.websiteUrl}</p>
            </div>

            {projectId && (
              <ProjectInsightsSection
                project={selectedProject}
                projectId={projectId}
                onConnectGA={() => setShowConnectGAModal(true)}
                onConnectAds={() => setShowConnectAdsModal(true)}
                onConnectSearchConsole={() => setShowConnectSearchConsoleModal(true)}
                onConnectYouTube={() => setShowConnectYouTubeModal(true)}
                onConnectFacebook={() => setShowConnectFacebookModal(true)}
                onConnectMetaAds={() => setShowConnectMetaAdsModal(true)}
                onConnectInstagram={() => setShowConnectInstagramModal(true)}
                onConnectGoogleSheets={() => setShowConnectGoogleSheetsModal(true)}
                onConnectGoogleDrive={() => setShowConnectGoogleDriveModal(true)}
                onConnectLinkedIn={() => setShowConnectLinkedInModal(true)}
                onConnectGBP={() => setShowConnectGBPModal(true)}
              />
            )}
          </>
        )}

        {selectedProject && isCollapsed && projectId && (
          <CollapsedProjectNav projectId={projectId} project={selectedProject} />
        )}
      </div>

      {/* Connection Modals */}
      {showConnectGAModal && projectId && (
        <ConnectGoogleAnalytics
          projectId={projectId}
          onSuccess={() => {
            setShowConnectGAModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectGAModal(false)}
        />
      )}

      {showConnectAdsModal && projectId && (
        <ConnectGoogleAds
          projectId={projectId}
          onSuccess={() => {
            setShowConnectAdsModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectAdsModal(false)}
        />
      )}

      {showConnectSearchConsoleModal && projectId && (
        <ConnectGoogleSearchConsole
          projectId={projectId}
          onSuccess={() => {
            setShowConnectSearchConsoleModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectSearchConsoleModal(false)}
        />
      )}

      {showConnectYouTubeModal && projectId && (
        <ConnectYouTube
          projectId={projectId}
          onSuccess={() => {
            setShowConnectYouTubeModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectYouTubeModal(false)}
        />
      )}

      {showConnectFacebookModal && projectId && (
        <ConnectFacebook
          projectId={projectId}
          onSuccess={() => {
            setShowConnectFacebookModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectFacebookModal(false)}
        />
      )}

      {showConnectMetaAdsModal && projectId && (
        <ConnectMetaAds
          projectId={projectId}
          onSuccess={() => {
            setShowConnectMetaAdsModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectMetaAdsModal(false)}
        />
      )}

      {showConnectInstagramModal && projectId && (
        <ConnectInstagram
          projectId={projectId}
          onSuccess={() => {
            setShowConnectInstagramModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectInstagramModal(false)}
        />
      )}

      {showConnectGoogleSheetsModal && projectId && (
        <ConnectGoogleSheets
          projectId={projectId}
          onSuccess={() => {
            setShowConnectGoogleSheetsModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectGoogleSheetsModal(false)}
        />
      )}

      {showConnectGoogleDriveModal && projectId && (
        <ConnectGoogleDrive
          projectId={projectId}
          onSuccess={() => {
            setShowConnectGoogleDriveModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectGoogleDriveModal(false)}
        />
      )}

      {showConnectLinkedInModal && projectId && (
        <ConnectLinkedIn
          projectId={projectId}
          onSuccess={() => {
            setShowConnectLinkedInModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectLinkedInModal(false)}
        />
      )}

      {showConnectGBPModal && projectId && (
        <ConnectGoogleBusinessProfile
          projectId={projectId}
          onSuccess={() => {
            setShowConnectGBPModal(false);
            void handleConnectSuccess();
          }}
          onClose={() => setShowConnectGBPModal(false)}
        />
      )}
    </>
  );
};

interface ConnectionStatus {
  label: string;
  connected: boolean;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProjectInsightsSectionProps {
  project: Project;
  projectId: string;
  onConnectGA: () => void;
  onConnectAds: () => void;
  onConnectSearchConsole: () => void;
  onConnectYouTube: () => void;
  onConnectFacebook: () => void;
  onConnectMetaAds: () => void;
  onConnectInstagram: () => void;
  onConnectGoogleSheets: () => void;
  onConnectGoogleDrive: () => void;
  onConnectLinkedIn: () => void;
  onConnectGBP: () => void;
}

const ProjectInsightsSection = ({
  project,
  projectId,
  onConnectGA,
  onConnectAds,
  onConnectSearchConsole,
  onConnectYouTube,
  onConnectFacebook,
  onConnectMetaAds,
  onConnectInstagram,
  onConnectGoogleSheets,
  onConnectGoogleDrive,
  onConnectLinkedIn,
  onConnectGBP
}: ProjectInsightsSectionProps) => {
  const connections: ConnectionStatus[] = [
    { label: "Google Analytics", connected: !!project?.gaPropertyId, route: `/dashboard/${projectId}/analytics`, icon: BarChart3 },
    { label: "YouTube", connected: !!project?.youtubeChannelId, route: `/dashboard/${projectId}/youtube`, icon: Youtube },
    { label: "Google Ads", connected: !!project?.googleAdsCustomerId, route: `/dashboard/${projectId}/ads`, icon: TrendingUp },
    { label: "Search Console", connected: !!project?.searchConsoleSiteUrl, route: `/dashboard/${projectId}/search-console`, icon: Search },
    { label: "Facebook Insights", connected: !!project?.facebookPageId, route: `/dashboard/${projectId}/facebook`, icon: Facebook },
    { label: "Meta Ads", connected: !!project?.metaAdsAccountId, route: `/dashboard/${projectId}/meta-ads`, icon: Megaphone },
    { label: "Instagram", connected: !!project?.instagram?.igUserId, route: `/dashboard/${projectId}/instagram`, icon: Instagram },
    { label: "Google Sheets", connected: !!project?.googleSheetId, route: `/dashboard/${projectId}/sheets`, icon: FileSpreadsheet },
    { label: "Google Drive", connected: !!project?.googleDriveFolderId, route: `/dashboard/${projectId}/drive`, icon: HardDrive },
    { label: "LinkedIn", connected: !!project?.linkedinPageId, route: `/dashboard/${projectId}/linkedin`, icon: Linkedin },
    { label: "Google Reviews", connected: !!project?.googleBusinessProfileLocationId, route: `/dashboard/${projectId}/reviews`, icon: Star },
  ];

  const pendingConnections = connections.filter((conn) => !conn.connected);
  const connectedServices = connections.filter((conn) => conn.connected);

  const navItems = [
    { label: "Overview", to: `/dashboard/${projectId}`, icon: LayoutDashboard },
    ...connectedServices.map((conn) => ({ label: conn.label, to: conn.route, icon: conn.icon })),
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col min-h-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      {/* Project Insights Navigation */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Project Insights
        </h3>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === `/dashboard/${projectId}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Pending Connections Section */}
      {pendingConnections.length > 0 && (
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Connections
            </h3>
          </div>
          <div className="space-y-2">
            {pendingConnections.map((conn) => {
              const Icon = conn.icon;
              const handleConnect = () => {
                if (conn.label === "Google Analytics") onConnectGA();
                else if (conn.label === "YouTube") onConnectYouTube();
                else if (conn.label === "Google Ads") onConnectAds();
                else if (conn.label === "Search Console") onConnectSearchConsole();
                else if (conn.label === "Facebook Insights") onConnectFacebook();
                else if (conn.label === "Meta Ads") onConnectMetaAds();
                else if (conn.label === "Instagram") onConnectInstagram();
                else if (conn.label === "Google Sheets") onConnectGoogleSheets();
                else if (conn.label === "Google Drive") onConnectGoogleDrive();
                else if (conn.label === "LinkedIn") onConnectLinkedIn();
                else if (conn.label === "Google Reviews") onConnectGBP();
              };
              return (
                <div
                  key={conn.label}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-50 border border-slate-200"
                >
                  <div className="relative">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <XCircle className="h-3 w-3 absolute -top-1 -right-1 text-slate-400 bg-white rounded-full" />
                  </div>
                  <span className="flex-1 text-slate-600 text-xs">{conn.label}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleConnect}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connected Services Summary */}
      {connectedServices.length > 0 && (
        <div className="p-4 mt-auto bg-slate-50/50 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-xs font-semibold text-slate-600">
              Connected ({connectedServices.length}/{connections.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {connectedServices.map((conn) => {
              const Icon = conn.icon;
              return (
                <div
                  key={conn.label}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
                  title={conn.label}
                >
                  <Icon className="h-3 w-3 text-emerald-600" />
                  <span className="text-[10px] font-medium text-emerald-700">
                    {conn.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface CollapsedProjectNavProps {
  projectId: string;
  project: Project;
}

const CollapsedProjectNav = ({ projectId, project }: CollapsedProjectNavProps) => {
  const connections: ConnectionStatus[] = [
    { label: "Google Analytics", connected: !!project?.gaPropertyId, route: `/dashboard/${projectId}/analytics`, icon: BarChart3 },
    { label: "YouTube", connected: !!project?.youtubeChannelId, route: `/dashboard/${projectId}/youtube`, icon: Youtube },
    { label: "Google Ads", connected: !!project?.googleAdsCustomerId, route: `/dashboard/${projectId}/ads`, icon: TrendingUp },
    { label: "Search Console", connected: !!project?.searchConsoleSiteUrl, route: `/dashboard/${projectId}/search-console`, icon: Search },
    { label: "Facebook Insights", connected: !!project?.facebookPageId, route: `/dashboard/${projectId}/facebook`, icon: Facebook },
    { label: "Meta Ads", connected: !!project?.metaAdsAccountId, route: `/dashboard/${projectId}/meta-ads`, icon: Megaphone },
    { label: "Instagram", connected: !!project?.instagram?.igUserId, route: `/dashboard/${projectId}/instagram`, icon: Instagram },
    { label: "Google Sheets", connected: !!project?.googleSheetId, route: `/dashboard/${projectId}/sheets`, icon: FileSpreadsheet },
    { label: "Google Drive", connected: !!project?.googleDriveFolderId, route: `/dashboard/${projectId}/drive`, icon: HardDrive },
    { label: "LinkedIn", connected: !!project?.linkedinPageId, route: `/dashboard/${projectId}/linkedin`, icon: Linkedin },
    { label: "Google Reviews", connected: !!project?.googleBusinessProfileLocationId, route: `/dashboard/${projectId}/reviews`, icon: Star },
  ];

  const connectedServices = connections.filter((conn) => conn.connected);

  const navItems = [
    { label: "Overview", to: `/dashboard/${projectId}`, icon: LayoutDashboard },
    ...connectedServices.map((conn) => ({ label: conn.label, to: conn.route, icon: conn.icon })),
  ];

  return (
    <div className="flex flex-col flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/dashboard/${projectId}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )
              }
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default ProjectSelector;
