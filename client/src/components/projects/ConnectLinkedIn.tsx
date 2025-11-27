import { useEffect, useMemo, useState } from "react";
import { X, Linkedin, Search, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface LinkedInPage {
  id: string;
  name: string;
  vanityName?: string;
  logoUrl?: string;
  followerCount?: number;
}

interface ConnectLinkedInProps {
  projectId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectLinkedIn = ({ projectId, onSuccess, onClose }: ConnectLinkedInProps) => {
  const [step, setStep] = useState<Step>("init");
  const [pages, setPages] = useState<LinkedInPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter pages based on search query
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) {
      return pages;
    }
    const query = searchQuery.toLowerCase().trim();
    return pages.filter(
      (page) =>
        page.name.toLowerCase().includes(query) ||
        page.id.includes(query) ||
        page.vanityName?.toLowerCase().includes(query)
    );
  }, [pages, searchQuery]);

  // Check if connection already exists when component mounts
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ success: boolean; data: LinkedInPage[] }>(
          `/linkedin/pages/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setPages(data.data);
          setStep("select");
        }
      } catch (err: any) {
        // Connection doesn't exist or error - stay on init step
        console.log('[ConnectLinkedIn] No existing connection:', err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    void checkExistingConnection();
  }, [projectId]);

  // Step 1: Initiate OAuth - Get auth URL from backend and redirect
  const handleInitiateAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the auth URL from backend (NOT hardcoded!)
      const { data } = await api.get<{ success: boolean; authUrl: string; error?: string }>(
        `/linkedin/auth-url?projectId=${projectId}`
      );
      
      if (!data.success || !data.authUrl) {
        throw new Error(data.error || 'Failed to get authorization URL');
      }
      
      setStep("oauth");
      
      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.authUrl,
        "LinkedIn Authorization",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      // Listen for message from popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === "LINKEDIN_OAUTH_SUCCESS" && event.data.projectId === projectId) {
          window.removeEventListener("message", messageListener);
          handleCheckConnection();
        } else if (event.data.type === "LINKEDIN_OAUTH_ERROR") {
          window.removeEventListener("message", messageListener);
          setError(event.data.error || "OAuth authorization failed");
          setStep("init");
          setLoading(false);
        }
      };
      window.addEventListener("message", messageListener);

      // Listen for popup close (fallback)
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
          setTimeout(() => handleCheckConnection(), 1000);
        }
      }, 1000);
    } catch (err: any) {
      console.error('[ConnectLinkedIn] Auth error:', err);
      setError(err.response?.data?.error || err.message || "Failed to initiate authorization");
      setStep("init");
      setLoading(false);
    }
  };

  // Check if connection was successful and fetch pages
  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; data: LinkedInPage[]; error?: string }>(
        `/linkedin/pages/${projectId}`
      );
      if (data.success && data.data.length > 0) {
        setPages(data.data);
        setStep("select");
      } else {
        // Connection might exist but no pages found - allow manual entry
        setError("Connected successfully! Enter your LinkedIn profile/page ID manually below.");
        setStep("select");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to fetch LinkedIn pages";
      console.error('[ConnectLinkedIn] Check connection error:', errorMessage);
      
      if (errorMessage.includes('connection not found')) {
        setError("LinkedIn authorization was not completed. Please try again.");
        setStep("init");
      } else {
        setError(errorMessage);
        setStep("select"); // Allow manual entry
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save selected page to project
  const handleSavePage = async () => {
    if (!selectedPageId) {
      setError("Please select a LinkedIn page or enter an ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post("/linkedin/page", {
        projectId,
        pageId: selectedPageId,
      });
      setStep("success");
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save LinkedIn page");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return String(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Linkedin className="h-8 w-8 text-[#0A66C2]" />
            <div>
              <CardTitle className="text-2xl text-hotel-navy">Connect LinkedIn</CardTitle>
              <CardDescription>
                {step === "init" && "Authorize access to your LinkedIn page"}
                {step === "oauth" && "Waiting for authorization..."}
                {step === "select" && "Select your LinkedIn page"}
                {step === "success" && "LinkedIn connected successfully!"}
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
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
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
                  <span className="text-[#0A66C2] mt-0.5">•</span>
                  <span>A LinkedIn account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0A66C2] mt-0.5">•</span>
                  <span>Permission to access LinkedIn data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0A66C2] mt-0.5">•</span>
                  <span>Admin access to a LinkedIn Company Page (for full analytics)</span>
                </li>
              </ul>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Make sure your LinkedIn Developer App has "Sign In with LinkedIn using OpenID Connect" enabled 
                and the redirect URL <code className="bg-blue-100 px-1 rounded">http://localhost:3000/api/linkedin/callback</code> is added.
              </p>
            </div>
            <Button
              onClick={handleInitiateAuth}
              disabled={loading}
              className="w-full bg-[#0A66C2] hover:bg-[#004182]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <Linkedin className="mr-2 h-4 w-4" />
                  Authorize LinkedIn Access
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: OAuth in progress */}
        {step === "oauth" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#0A66C2]" />
            <p className="text-center text-sm text-slate-600">
              Complete the authorization in the popup window...
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitiateAuth}
            >
              Reopen Authorization Window
            </Button>
          </div>
        )}

        {/* Step 3: Select Page */}
        {step === "select" && (
          <div className="space-y-4">
            {/* Search */}
            {pages.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* Pages List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {filteredPages.length === 0 && pages.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No pages found. Enter your LinkedIn profile/page ID manually below.
                </p>
              ) : filteredPages.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No pages found matching your search.
                </p>
              ) : (
                filteredPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPageId === page.id
                        ? "border-[#0A66C2] bg-blue-50"
                        : "border-slate-200 hover:border-[#0A66C2]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {page.logoUrl && (
                            <img 
                              src={page.logoUrl} 
                              alt={page.name} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <h4 className="font-semibold text-slate-900 truncate">
                            {page.name}
                          </h4>
                          {selectedPageId === page.id && (
                            <CheckCircle2 className="h-5 w-5 text-[#0A66C2] flex-shrink-0" />
                          )}
                        </div>
                        {page.vanityName && (
                          <p className="text-xs text-slate-500 mb-2">@{page.vanityName}</p>
                        )}
                        <div className="flex gap-4 text-xs text-slate-500">
                          {page.followerCount !== undefined && (
                            <span>{formatNumber(page.followerCount)} followers</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Manual Entry Option */}
            <div className="pt-4 border-t">
              <Label htmlFor="manual-page-id" className="text-sm text-slate-600">
                Or enter page/profile ID manually:
              </Label>
              <Input
                id="manual-page-id"
                placeholder="Enter LinkedIn ID..."
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
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
              <h3 className="font-semibold text-lg mb-1">LinkedIn Connected!</h3>
              <p className="text-sm text-slate-600">
                Your LinkedIn page has been linked successfully.
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
              onClick={handleSavePage}
              disabled={!selectedPageId || loading}
              className="bg-[#0A66C2] hover:bg-[#004182]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Page"
              )}
            </Button>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectLinkedIn;
