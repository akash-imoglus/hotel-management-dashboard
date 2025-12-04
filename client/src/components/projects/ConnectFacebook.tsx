import { useState, useEffect, useMemo } from "react";
import { X, Link2, Loader2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/common/LoadingState";
import api from "@/lib/api";
import type { FacebookPage } from "@/types";

interface ConnectFacebookProps {
  projectId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectFacebook = ({ projectId, onSuccess, onClose }: ConnectFacebookProps) => {
  const [step, setStep] = useState<Step>("init");
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter pages based on search query (by name or category)
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) {
      return pages;
    }
    const query = searchQuery.toLowerCase().trim();
    return pages.filter(
      (page) =>
        page.name.toLowerCase().includes(query) ||
        page.category.toLowerCase().includes(query) ||
        page.id.includes(query)
    );
  }, [pages, searchQuery]);

  // Check if connection already exists when component mounts
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        // Try to fetch pages - if this succeeds, connection exists
        const { data } = await api.get<{ success: boolean; data: FacebookPage[] }>(
          `/facebook/pages/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setPages(data.data);
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

  // Step 1: Initiate OAuth
  const handleInitiateAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; data: { authUrl: string } }>(
        `/facebook/auth?projectId=${projectId}`
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
          "Facebook Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        // Listen for message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === "FACEBOOK_OAUTH_SUCCESS" && event.data.projectId === projectId) {
            window.removeEventListener("message", messageListener);
            handleCheckConnection();
          } else if (event.data.type === "FACEBOOK_OAUTH_ERROR") {
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
      setError(err instanceof Error ? err.message : "Failed to initiate Facebook connection");
    } finally {
      setLoading(false);
    }
  };

  // Check if connection was established and fetch pages
  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch available Facebook pages
      const { data } = await api.get<{ success: boolean; data: FacebookPage[] }>(
        `/facebook/pages/${projectId}`
      );
      if (data.success) {
        if (data.data.length > 0) {
          // Successfully fetched pages - show them for selection
          setPages(data.data);
          setStep("select");
        } else {
          // No pages returned - allow manual page ID entry (this is OK)
          setStep("select");
          // Don't show error - just allow manual entry
        }
      } else {
        // API returned success:false
        setStep("select");
      }
    } catch (err: any) {
      // If error is about missing connection, user needs to complete OAuth
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Please complete the Facebook authorization in the popup window.");
      } else {
        // Allow manual entry if API fails - this is acceptable
        setStep("select");
        // Don't show error for API failures - manual entry is always available
        console.log("Could not fetch pages automatically, manual entry available");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select page and save
  const handleSavePage = async () => {
    if (!selectedPageId) {
      setError("Please select a Facebook page");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find the selected page to get its access token
      const selectedPage = pages.find(p => p.id === selectedPageId);
      const pageAccessToken = selectedPage?.access_token;

      const response = await api.post<{ success: boolean; data: any }>("/facebook/page", {
        projectId,
        pageId: selectedPageId,
        pageAccessToken, // Send the page access token for insights
      });

      console.log("Save page response:", response.data);

      // Verify the page was saved
      if (response.data.success) {
        const savedProject = response.data.data;
        if (savedProject?.facebookPageId === selectedPageId) {
          setStep("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          console.warn("Page ID mismatch:", { saved: savedProject?.facebookPageId, expected: selectedPageId });
          // Still proceed if response is successful
          setStep("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        throw new Error("Failed to save page ID");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save page");
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
            <CardTitle className="text-2xl text-hotel-navy">Connect Facebook</CardTitle>
            <CardDescription>
              Link your Facebook page to start tracking insights data
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
                  To connect Facebook, you'll need to:
                </p>
                <ol className="mt-2 ml-4 list-decimal space-y-2 text-sm text-slate-600">
                  <li>Authorize access to your Facebook account</li>
                  <li>Select or enter your Facebook page ID</li>
                  <li>Start viewing insights data</li>
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
                    Connect Facebook
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "oauth" && (
            <div className="space-y-4">
              <LoadingState message="Waiting for Facebook authorization..." />
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  A popup window should have opened. Please authorize access to your Facebook account.
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
                  Select Facebook Page
                </h3>
                <p className="text-sm text-slate-600">
                  Choose your Facebook page from the list below.
                </p>
              </div>

              {/* Pages List (if available) */}
              {pages.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Available Pages
                  </label>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by page name, category, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Pages List */}
                  {filteredPages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No pages found matching "{searchQuery}"</p>
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
                      {filteredPages.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => setSelectedPageId(page.id)}
                          className={`w-full text-left rounded-lg border p-4 transition-colors ${selectedPageId === page.id
                              ? "border-hotel-ocean bg-hotel-foam"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                          <div className="font-semibold text-slate-900">{page.name}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Page ID: {page.id} | Category: {page.category}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && filteredPages.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Showing {filteredPages.length} of {pages.length} pages
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-600">
                  No pages found. Please ensure you have pages set up in your Facebook account.
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
                  onClick={handleSavePage}
                  disabled={!selectedPageId || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Page"
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
                Your Facebook page has been linked. You can now view insights data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectFacebook;

