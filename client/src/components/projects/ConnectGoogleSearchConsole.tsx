import { useState, useEffect, useMemo } from "react";
import { X, Link2, Loader2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/common/LoadingState";
import api from "@/lib/api";
import type { GoogleSearchConsoleSite } from "@/types";

interface ConnectGoogleSearchConsoleProps {
  projectId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectGoogleSearchConsole = ({ projectId, onSuccess, onClose }: ConnectGoogleSearchConsoleProps) => {
  const [step, setStep] = useState<Step>("init");
  const [sites, setSites] = useState<GoogleSearchConsoleSite[]>([]);
  const [selectedSiteUrl, setSelectedSiteUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter sites based on search query (by site URL or permission level)
  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) {
      return sites;
    }
    const query = searchQuery.toLowerCase().trim();
    return sites.filter(
      (site) =>
        site.siteUrl.toLowerCase().includes(query) ||
        site.permissionLevel.toLowerCase().includes(query)
    );
  }, [sites, searchQuery]);

  // Check if connection already exists when component mounts
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        // Try to fetch sites - if this succeeds, connection exists
        const { data } = await api.get<{ success: boolean; data: GoogleSearchConsoleSite[] }>(
          `/gsc/sites/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setSites(data.data);
          setStep("select");
        }
      } catch (err) {
        // Connection doesn't exist or error - stay on init step
        // This is expected if OAuth hasn't been completed
      } finally {
        setLoading(false);
      }
    };
    void checkExistingConnection();
  }, [projectId]);

  // Step 1: Initiate OAuth - call backend to get auth URL
  const handleInitiateAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      // Call backend endpoint to get the OAuth URL (never build URL in frontend)
      const { data } = await api.get<{ success: boolean; data: { authUrl: string } }>(
        `/gsc/auth?projectId=${projectId}`
      );
      if (data.success && data.data.authUrl) {
        setStep("oauth");
        // Open OAuth window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.data.authUrl,
          "Google Search Console Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        // Listen for message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === "GOOGLE_SEARCH_CONSOLE_OAUTH_SUCCESS" && event.data.projectId === projectId) {
            window.removeEventListener("message", messageListener);
            handleCheckConnection();
          } else if (event.data.type === "GOOGLE_SEARCH_CONSOLE_OAUTH_ERROR") {
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
      setError(err instanceof Error ? err.message : "Failed to initiate Google Search Console connection");
    } finally {
      setLoading(false);
    }
  };

  // Check if connection was established and fetch sites
  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch available Search Console sites
      const { data } = await api.get<{ success: boolean; data: GoogleSearchConsoleSite[] }>(
        `/gsc/sites/${projectId}`
      );
      if (data.success && data.data.length > 0) {
        setSites(data.data);
        setStep("select");
      } else {
        // If no sites returned, allow manual site URL entry
        setError("No Search Console sites found. You can manually enter your site URL.");
        setStep("select");
      }
    } catch (err: any) {
      // If error is about missing connection, user needs to complete OAuth
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Please complete the Google authorization in the popup window.");
      } else {
        // Allow manual entry if API fails
        setStep("select");
        setError("Could not fetch sites automatically. Please enter your site URL manually.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select site and save
  const handleSaveSite = async () => {
    if (!selectedSiteUrl) {
      setError("Please select a Search Console site");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ success: boolean; data: any }>("/gsc/site", {
        projectId,
        siteUrl: selectedSiteUrl.trim(),
      });

      console.log("Save site response:", response.data);

      // Verify the site was saved
      if (response.data.success) {
        const savedProject = response.data.data;
        if (savedProject?.searchConsoleSiteUrl === selectedSiteUrl.trim()) {
          setStep("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          console.warn("Site URL mismatch:", { saved: savedProject?.searchConsoleSiteUrl, expected: selectedSiteUrl.trim() });
          // Still proceed if response is successful
          setStep("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        throw new Error("Failed to save site URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save site");
      setStep("select"); // Go back to selection step on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-hotel-navy">Connect Google Search Console</CardTitle>
            <CardDescription>
              Link your Google Search Console account to start tracking search performance data
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "init" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  To connect Google Search Console, you'll need to:
                </p>
                <ol className="mt-2 ml-4 list-decimal space-y-2 text-sm text-slate-600">
                  <li>Authorize access to your Google Search Console account</li>
                  <li>Select or enter your Search Console site URL</li>
                  <li>Start viewing search performance data</li>
                </ol>
              </div>
              {error && (
                <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <Button
                onClick={handleInitiateAuth}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect Google Search Console
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "oauth" && (
            <div className="space-y-4">
              <LoadingState message="Waiting for Google authorization..." />
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  A popup window should have opened. Please authorize access to your Google Search Console account.
                  If the popup didn't open, check your browser's popup blocker settings.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("init")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCheckConnection} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "I've Authorized"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Select Search Console Site
                </h3>
                <p className="text-sm text-slate-600">
                  Choose your Search Console site from the list below.
                </p>
              </div>

              {/* Sites List (if available) */}
              {sites.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Available Sites
                  </label>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by site URL or permission level..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Sites List */}
                  {filteredSites.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No sites found matching "{searchQuery}"</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="mt-2"
                      >
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredSites.map((site) => (
                        <button
                          key={site.siteUrl}
                          onClick={() => setSelectedSiteUrl(site.siteUrl)}
                          className={`w-full text-left rounded-lg border p-4 transition-colors ${selectedSiteUrl === site.siteUrl
                            ? "border-hotel-ocean bg-hotel-foam"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                          <div className="font-semibold text-slate-900">{site.siteUrl}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Permission: {site.permissionLevel}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && filteredSites.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Showing {filteredSites.length} of {sites.length} sites
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-600">
                  No sites found. Please ensure you have sites set up in your Google Search Console account.
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("init")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSaveSite}
                  disabled={!selectedSiteUrl || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Site"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-slate-900">
                Successfully Connected!
              </h3>
              <p className="text-slate-600">
                Your Google Search Console account has been linked. You can now view search performance data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectGoogleSearchConsole;

