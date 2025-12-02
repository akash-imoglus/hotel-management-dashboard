import { useEffect, useMemo, useState } from "react";
import { X, HardDrive, Search, CheckCircle2, Loader2, AlertCircle, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

interface ConnectGoogleDriveProps {
  projectId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectGoogleDrive = ({ projectId, onSuccess, onClose }: ConnectGoogleDriveProps) => {
  const [step, setStep] = useState<Step>("init");
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders;
    }
    const query = searchQuery.toLowerCase().trim();
    return folders.filter(
      (folder) =>
        folder.name.toLowerCase().includes(query) ||
        folder.id.includes(query)
    );
  }, [folders, searchQuery]);

  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ success: boolean; data: DriveFolder[] }>(
          `/google-drive/folders/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setFolders(data.data);
          setStep("select");
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || "";
        if (errorMessage.includes("Google Drive API") || errorMessage.includes("not been used") || errorMessage.includes("disabled")) {
          setError("⚠️ Google Drive API is not enabled. Please enable it in your Google Cloud Console.");
        }
      } finally {
        setLoading(false);
      }
    };
    void checkExistingConnection();
  }, [projectId]);

  const handleInitiateAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; authUrl: string }>(
        `/google-drive/auth?projectId=${projectId}`
      );
      if (data.success && data.authUrl) {
        setStep("oauth");
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          "Google Drive Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        const checkPopup = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            try {
              const { data: foldersData } = await api.get<{ success: boolean; data: DriveFolder[] }>(
                `/google-drive/folders/${projectId}`
              );
              if (foldersData.success && foldersData.data.length > 0) {
                setFolders(foldersData.data);
                setStep("select");
              } else {
                setStep("init");
                setError("Authorization was cancelled or failed. Please try again.");
              }
            } catch (e) {
              setStep("init");
              setError("Failed to fetch folders after authorization.");
            }
            setLoading(false);
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  const handleSaveFolder = async () => {
    if (!selectedFolderId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/google-drive/folder', {
        projectId,
        folderId: selectedFolderId,
      });

      setStep("success");
      
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-slate-900">Connect Google Drive</CardTitle>
              <CardDescription className="text-slate-500">
                Link a Drive folder to your project
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === "init" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <HardDrive className="h-12 w-12 text-blue-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-slate-900">Connect Google Drive</h3>
                <p className="text-sm text-slate-600 max-w-md">
                  Authorize access to your Google Drive to view and manage files.
                </p>
              </div>
              <Button
                onClick={handleInitiateAuth}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <HardDrive className="mr-2 h-4 w-4" />
                    Connect with Google
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "oauth" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-slate-900">Authorizing...</h3>
                <p className="text-sm text-slate-600">
                  Complete the authorization in the popup window.
                </p>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {filteredFolders.length === 0 ? (
                  <p className="text-center py-4 text-slate-500">No folders found</p>
                ) : (
                  filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedFolderId === folder.id
                          ? "border-blue-600 bg-blue-600 shadow-md"
                          : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className={`h-5 w-5 flex-shrink-0 ${
                          selectedFolderId === folder.id
                            ? "text-white"
                            : "text-blue-600"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${
                            selectedFolderId === folder.id
                              ? "text-white"
                              : "text-slate-900"
                          }`}>
                            {folder.name}
                          </p>
                          <p className={`text-xs truncate mt-0.5 font-mono ${
                            selectedFolderId === folder.id
                              ? "text-blue-100"
                              : "text-slate-500"
                          }`}>
                            {folder.id}
                          </p>
                        </div>
                        {selectedFolderId === folder.id && (
                          <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-slate-900">Google Drive Connected!</h3>
                <p className="text-sm text-slate-600">
                  Your folder has been linked successfully.
                </p>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveFolder}
                disabled={!selectedFolderId || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Folder"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectGoogleDrive;





