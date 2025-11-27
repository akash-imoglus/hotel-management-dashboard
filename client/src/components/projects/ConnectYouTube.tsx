import { useEffect, useMemo, useState } from "react";
import { X, Youtube, Search, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface YouTubeChannel {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

interface ConnectYouTubeProps {
  projectId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectYouTube = ({ projectId, onSuccess, onClose }: ConnectYouTubeProps) => {
  const [step, setStep] = useState<Step>("init");
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter channels based on search query (by title or channel ID)
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) {
      return channels;
    }
    const query = searchQuery.toLowerCase().trim();
    return channels.filter(
      (channel) =>
        channel.title.toLowerCase().includes(query) ||
        channel.channelId.includes(query) ||
        channel.customUrl?.toLowerCase().includes(query)
    );
  }, [channels, searchQuery]);

  // Check if connection already exists when component mounts
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        // Try to fetch channels - if this succeeds, connection exists
        const { data } = await api.get<{ success: boolean; data: YouTubeChannel[] }>(
          `/youtube/channels/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setChannels(data.data);
          setStep("select");
        } else if (data.success) {
          // Connection exists but no channels found - allow manual entry
          setStep("select");
          setError("⚠️ No channels found automatically. You can enter your YouTube Channel ID manually below.");
        }
      } catch (err: any) {
        // Connection doesn't exist or error - stay on init step
        // This is expected if OAuth hasn't been completed
        const errorMessage = err.response?.data?.error || err.message || "";
        if (errorMessage.includes("YouTube Data API") || errorMessage.includes("not been used") || errorMessage.includes("disabled")) {
          // API disabled but connection might exist - go to select for manual entry
          setStep("select");
          setError("⚠️ YouTube Data API v3 is not enabled. You can enter your channel ID manually after connecting.");
        } else if (errorMessage.includes("connection not found")) {
          // No OAuth connection - stay on init step
          console.log("[ConnectYouTube] No existing connection, showing OAuth step");
        }
      } finally {
        setLoading(false);
      }
    };
    void checkExistingConnection();
  }, [projectId]);

  // Step 1: Initiate OAuth
  const handleInitiateAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; authUrl: string }>(
        `/youtube/auth?projectId=${projectId}`
      );
      if (data.success && data.authUrl) {
        setAuthUrl(data.authUrl);
        setStep("oauth");
        // Open OAuth window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          "YouTube Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        // Listen for message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === "YOUTUBE_OAUTH_SUCCESS" && event.data.projectId === projectId) {
            window.removeEventListener("message", messageListener);
            handleCheckConnection();
          } else if (event.data.type === "YOUTUBE_OAUTH_ERROR") {
            window.removeEventListener("message", messageListener);
            setError(event.data.error || "OAuth authorization failed");
            setStep("init");
          }
        };
        window.addEventListener("message", messageListener);

        // Listen for popup close (fallback)
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageListener);
            // Give it a moment, then check connection
            setTimeout(() => handleCheckConnection(), 1000);
          }
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate authorization");
      setStep("init");
    } finally {
      setLoading(false);
    }
  };

  // Check if connection was successful and fetch channels
  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; data: YouTubeChannel[] }>(
        `/youtube/channels/${projectId}`
      );
      if (data.success && data.data.length > 0) {
        setChannels(data.data);
        setStep("select");
      } else {
        // No channels found but connection exists - allow manual entry
        setError("⚠️ Couldn't automatically fetch your channels. This might be because YouTube Data API v3 is not enabled. Please enter your YouTube Channel ID manually below.");
        setStep("select");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "";
      if (errorMessage.includes("YouTube Data API") || errorMessage.includes("not been used") || errorMessage.includes("disabled")) {
        setError("⚠️ YouTube Data API v3 is not enabled in your Google Cloud project. Please enable it, then reconnect. For now, you can enter your Channel ID manually below.");
        setStep("select");
      } else {
        setError(errorMessage || "Failed to fetch YouTube channels");
        setStep("init");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save selected channel to project
  const handleSaveChannel = async () => {
    if (!selectedChannelId) {
      setError("Please select a YouTube channel or enter a channel ID");
      return;
    }

    // Validate channel ID format (should start with UC for user channels)
    const trimmedChannelId = selectedChannelId.trim();
    if (!trimmedChannelId.startsWith("UC") && trimmedChannelId.length !== 24) {
      setError("Invalid channel ID format. YouTube channel IDs typically start with 'UC' and are 24 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post("/youtube/channel", {
        projectId,
        channelId: trimmedChannelId,
      });
      setStep("success");
      // Wait a moment then close and trigger success
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to save YouTube channel";
      if (errorMessage.includes("OAuth connection not found") || errorMessage.includes("connection not found")) {
        setError("⚠️ Please complete YouTube authorization first before entering a channel ID.");
        setStep("init");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string) => {
    const parsed = parseInt(num, 10);
    if (parsed >= 1000000) {
      return `${(parsed / 1000000).toFixed(1)}M`;
    } else if (parsed >= 1000) {
      return `${(parsed / 1000).toFixed(1)}K`;
    }
    return num;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-600" />
            <div>
              <CardTitle className="text-2xl text-hotel-navy">Connect YouTube</CardTitle>
              <CardDescription>
                {step === "init" && "Authorize access to your YouTube channel"}
                {step === "oauth" && "Waiting for authorization..."}
                {step === "select" && "Select your YouTube channel"}
                {step === "success" && "YouTube connected successfully!"}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Initial - Authorize */}
        {step === "init" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold mb-2">What you'll need:</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>A YouTube channel with content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Permission to access YouTube Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Google account credentials</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={handleInitiateAuth}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <Youtube className="mr-2 h-4 w-4" />
                  Authorize YouTube Access
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: OAuth in progress */}
        {step === "oauth" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            <p className="text-center text-sm text-slate-600">
              Complete the authorization in the popup window...
            </p>
            {authUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(authUrl)}
              >
                Reopen Authorization Window
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Select Channel */}
        {step === "select" && (
          <div className="space-y-4">
            {/* Search */}
            {channels.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* Channels List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {filteredChannels.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No channels found matching your search.
                </p>
              ) : (
                filteredChannels.map((channel) => (
                  <button
                    key={channel.channelId}
                    onClick={() => setSelectedChannelId(channel.channelId)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedChannelId === channel.channelId
                        ? "border-red-600 bg-red-50"
                        : "border-slate-200 hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {channel.title}
                          </h4>
                          {selectedChannelId === channel.channelId && (
                            <CheckCircle2 className="h-5 w-5 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        {channel.customUrl && (
                          <p className="text-xs text-slate-500 mb-2">{channel.customUrl}</p>
                        )}
                        {channel.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                            {channel.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>{formatNumber(channel.subscriberCount)} subscribers</span>
                          <span>{formatNumber(channel.videoCount)} videos</span>
                          <span>{formatNumber(channel.viewCount)} views</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Manual Entry Option */}
            <div className="pt-4 border-t">
              <Label htmlFor="manual-channel-id" className="text-sm text-slate-600">
                Or enter channel ID manually:
              </Label>
              <Input
                id="manual-channel-id"
                placeholder="UC..."
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1">YouTube Connected!</h3>
              <p className="text-sm text-slate-600">
                Your YouTube channel has been linked successfully.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {step === "select" && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveChannel}
              disabled={!selectedChannelId || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Channel"
              )}
            </Button>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectYouTube;

