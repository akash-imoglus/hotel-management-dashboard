import { useState, useEffect, useMemo } from "react";
import { X, Link2, Loader2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import api from "@/lib/api";
import type { GA4Property } from "@/types";

interface ConnectGoogleAnalyticsProps {
  projectId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectGoogleAnalytics = ({ projectId, onSuccess, onClose }: ConnectGoogleAnalyticsProps) => {
  const [step, setStep] = useState<Step>("init");
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter properties based on search query (by name or property ID)
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) {
      return properties;
    }
    const query = searchQuery.toLowerCase().trim();
    return properties.filter(
      (property) =>
        property.displayName.toLowerCase().includes(query) ||
        property.propertyId.includes(query)
    );
  }, [properties, searchQuery]);

  // Check if connection already exists when component mounts
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        // Try to fetch properties - if this succeeds, connection exists
        const { data } = await api.get<{ success: boolean; data: GA4Property[] }>(
          `/google/properties/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setProperties(data.data);
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
        `/google/auth?projectId=${projectId}`
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
          "Google Analytics Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        // Listen for message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === "GA_OAUTH_SUCCESS" && event.data.projectId === projectId) {
            window.removeEventListener("message", messageListener);
            handleCheckConnection();
          } else if (event.data.type === "GA_OAUTH_ERROR") {
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
      setError(err instanceof Error ? err.message : "Failed to initiate Google Analytics connection");
    } finally {
      setLoading(false);
    }
  };

  // Check if connection was established and fetch properties
  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch available GA4 properties
      const { data } = await api.get<{ success: boolean; data: GA4Property[] }>(
        `/google/properties/${projectId}`
      );
      if (data.success && data.data.length > 0) {
        setProperties(data.data);
        setStep("select");
      } else {
        setError("No Google Analytics properties found. Please ensure you have GA4 properties set up.");
      }
    } catch (err: any) {
      // If error is about missing connection, user needs to complete OAuth
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Please complete the Google authorization in the popup window.");
      } else {
        setError(err.response?.data?.error || err.message || "Failed to fetch properties");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select property and save
  const handleSaveProperty = async () => {
    if (!selectedPropertyId) {
      setError("Please select a Google Analytics property");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ success: boolean; data: any }>("/google/property", {
        projectId,
        propertyId: selectedPropertyId,
      });

      console.log("Save property response:", response.data);

      // Verify the property was saved
      if (response.data.success) {
        const savedProject = response.data.data;
        if (savedProject?.gaPropertyId === selectedPropertyId) {
          setStep("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          console.warn("Property ID mismatch:", { saved: savedProject?.gaPropertyId, expected: selectedPropertyId });
          // Still proceed if response is successful
          setStep("success");
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        throw new Error("Failed to save property ID");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
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
            <CardTitle className="text-2xl text-hotel-navy">Connect Google Analytics</CardTitle>
            <CardDescription>
              Link your GA4 property to start tracking analytics
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
                  To connect Google Analytics, you'll need to:
                </p>
                <ol className="mt-2 ml-4 list-decimal space-y-2 text-sm text-slate-600">
                  <li>Authorize access to your Google Analytics account</li>
                  <li>Select the GA4 property for this website</li>
                  <li>Start viewing analytics data</li>
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
                    Connect Google Analytics
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
                  A popup window should have opened. Please authorize access to your Google Analytics account.
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
                  Select Google Analytics Property
                </h3>
                <p className="text-sm text-slate-600">
                  Choose the GA4 property that corresponds to your website.
                </p>
              </div>
              {properties.length === 0 ? (
                <ErrorState
                  description="No GA4 properties found. Please ensure you have GA4 properties set up in your Google Analytics account."
                  onRetry={handleCheckConnection}
                />
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by property name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Properties List */}
                  {filteredProperties.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No properties found matching "{searchQuery}"</p>
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
                      {filteredProperties.map((property) => (
                        <button
                          key={property.propertyId}
                          onClick={() => setSelectedPropertyId(property.propertyId)}
                          className={`w-full text-left rounded-lg border p-4 transition-colors ${selectedPropertyId === property.propertyId
                              ? "border-hotel-ocean bg-hotel-foam"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                          <div className="font-semibold text-slate-900">{property.displayName}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Property ID: {property.propertyId}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && filteredProperties.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Showing {filteredProperties.length} of {properties.length} properties
                    </p>
                  )}
                </>
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
                  onClick={handleSaveProperty}
                  disabled={!selectedPropertyId || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Property"
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
                Your Google Analytics property has been linked. You can now view analytics data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectGoogleAnalytics;

