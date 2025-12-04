import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { HardDrive, Folder, FileText, Image, Video, Music, Archive, ExternalLink, RefreshCw } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ReconnectButton from "@/components/common/ReconnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectGoogleDrive from "@/components/projects/ConnectGoogleDrive";
import api from "@/lib/api";
import type { Project, GoogleDriveStats, GoogleDriveFile } from "@/types";

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("folder")) return Folder;
  if (mimeType.includes("image")) return Image;
  if (mimeType.includes("video")) return Video;
  if (mimeType.includes("audio")) return Music;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive;
  return FileText;
};

const formatBytes = (bytes: string | number) => {
  const b = typeof bytes === "string" ? parseInt(bytes) : bytes;
  if (b === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const GoogleDrivePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [driveStats, setDriveStats] = useState<GoogleDriveStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingProject(true);
      const response = await api.get<{ success: boolean; data: Project }>(`/projects/${projectId}`);
      const proj = response.data.data || response.data;
      setProject(proj as Project);
      setProjectError(null);
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : "Project not found.");
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  const fetchDriveStats = useCallback(async () => {
    if (!projectId || !project?.googleDriveFolderId) return;
    try {
      setLoadingStats(true);
      const response = await api.get<{ success: boolean; data: GoogleDriveStats }>(
        `/google-drive/${projectId}/stats`
      );
      setDriveStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch drive stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [projectId, project?.googleDriveFolderId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project?.googleDriveFolderId) {
      void fetchDriveStats();
    }
  }, [fetchDriveStats, project?.googleDriveFolderId]);

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

  if (!project?.googleDriveFolderId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Google Drive</h1>
          <p className="text-sm text-slate-500">Connect a folder to your project</p>
        </div>

        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <HardDrive className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Google Drive</CardTitle>
                <CardDescription className="text-slate-500">
                  Link a folder to view and manage your files.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <HardDrive className="mr-2 h-4 w-4" />
              Connect Drive Folder
            </Button>
          </CardContent>
        </Card>

        {showConnectModal && (
          <ConnectGoogleDrive
            projectId={projectId!}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  const usagePercent = driveStats?.storageQuota
    ? (parseInt(driveStats.storageQuota.usage) / parseInt(driveStats.storageQuota.limit)) * 100
    : 0;

  return (
    <motion.section
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25">
            <HardDrive className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Google Drive</h1>
            <p className="text-sm text-slate-500">Connected folder data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="google-drive"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
            variant="outline"
          />
          <Button variant="outline" onClick={fetchDriveStats} disabled={loadingStats}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loadingStats ? (
        <LoadingState message="Loading drive stats..." />
      ) : driveStats ? (
        <div className="space-y-6">
          {/* Storage Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-100">Total Files</p>
                <p className="text-3xl font-bold">{driveStats.totalFiles}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-100">Total Folders</p>
                <p className="text-3xl font-bold">{driveStats.totalFolders}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Storage Used</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatBytes(driveStats.storageQuota.usage)}
                </p>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  of {formatBytes(driveStats.storageQuota.limit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Files */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Recent Files</CardTitle>
              <CardDescription className="text-slate-500">
                Most recently modified files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {driveStats.recentFiles.map((file: GoogleDriveFile) => {
                  const Icon = getFileIcon(file.mimeType);
                  return (
                    <div key={file.id} className="py-3 flex items-center gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {file.modifiedTime && new Date(file.modifiedTime).toLocaleDateString()}
                          {file.size && ` • ${formatBytes(file.size)}`}
                        </p>
                      </div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Folder ID */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Connected Folder ID</p>
                  <p className="font-mono text-sm text-slate-900">{project.googleDriveFolderId}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowConnectModal(true)}>
                  Change Folder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-white">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Unable to load drive stats.</p>
            <Button variant="outline" className="mt-4" onClick={fetchDriveStats}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {showConnectModal && (
        <ConnectGoogleDrive
          projectId={projectId!}
          onSuccess={handleConnectSuccess}
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </motion.section>
  );
};

export default GoogleDrivePage;





