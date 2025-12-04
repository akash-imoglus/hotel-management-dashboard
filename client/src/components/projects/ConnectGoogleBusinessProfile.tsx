import { useState, useEffect, useMemo } from "react";
import { X, Link2, Loader2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import api from "@/lib/api";

interface GBPLocation {
  name: string;
  locationId: string;
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
}

interface ConnectGoogleBusinessProfileProps {
  projectId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectGoogleBusinessProfile = ({ projectId, onSuccess, onClose }: ConnectGoogleBusinessProfileProps) => {
  const [step, setStep] = useState<Step>("init");
  const [locations, setLocations] = useState<GBPLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) {
      return locations;
    }
    const query = searchQuery.toLowerCase().trim();
    return locations.filter(
      (location) =>
        location.title.toLowerCase().includes(query) ||
        location.locationId.includes(query) ||
        location.storefrontAddress?.locality?.toLowerCase().includes(query)
    );
  }, [locations, searchQuery]);

  // Check if connection already exists when component mounts
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ success: boolean; data: GBPLocation[] }>(
          `/google-business-profile/locations/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setLocations(data.data);
          setStep("select");
        }
      } catch (err) {
        // Connection doesn't exist or error - stay on init step
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
        `/google-business-profile/auth?projectId=${projectId}`
      );
      if (data.success && data.data.authUrl) {
        setStep("oauth");

        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.data.authUrl,
          "Google Business Profile Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        // Listen for message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === "GBP_OAUTH_SUCCESS" && event.data.projectId === projectId) {
            window.removeEventListener("message", messageListener);
            handleCheckConnection();
          } else if (event.data.type === "GBP_OAUTH_ERROR") {
            window.removeEventListener("message", messageListener);
            setError(event.data.error || "OAuth authorization failed");
            setStep("init");
          }
        };
        window.addEventListener("message", messageListener);

        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          setError("Popup was blocked. Please allow popups for this site.");
          setStep("init");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate authorization");
      setStep("init");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Check connection and fetch locations
  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; data: GBPLocation[] }>(
        `/google-business-profile/locations/${projectId}`
      );
      if (data.success) {
        setLocations(data.data);
        setStep("select");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch locations");
      setStep("init");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save selected location
  const handleSaveLocation = async () => {
    if (!selectedLocationId) {
      setError("Please select a location");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post("/google-business-profile/location", {
        projectId,
        locationId: selectedLocationId,
      });
      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (location: GBPLocation): string => {
    if (!location.storefrontAddress) return "";
    const addr = location.storefrontAddress;
    const parts = [
      ...(addr.addressLines || []),
      addr.locality,
      addr.administrativeArea,
      addr.postalCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Connect Google Business Profile</CardTitle>
            <CardDescription>
              {step === "init" && "Authorize access to your Google Business Profile"}
              {step === "oauth" && "Complete authorization in the popup window"}
              {step === "select" && "Select your business location"}
              {step === "success" && "Connection successful!"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Step 1: Initial state */}
          {step === "init" && (
            <div className="space-y-4">
              {error && <ErrorState description={error} />}
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Link2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect Your Business Profile</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Access your Google reviews and business insights
                </p>
                <Button onClick={handleInitiateAuth} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Connect Google Business Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: OAuth in progress */}
          {step === "oauth" && (
            <div className="text-center py-8">
              <LoadingState message="Waiting for authorization..." />
              <p className="text-sm text-slate-600 mt-4">
                Please complete the authorization in the popup window
              </p>
            </div>
          )}

          {/* Step 3: Select location */}
          {step === "select" && (
            <div className="space-y-4">
              {error && <ErrorState description={error} />}

              {/* Search */}
              {locations.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Locations list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLocations.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    {searchQuery ? "No locations found matching your search" : "No locations found"}
                  </p>
                ) : (
                  filteredLocations.map((location) => (
                    <div
                      key={location.locationId}
                      onClick={() => setSelectedLocationId(location.locationId)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedLocationId === location.locationId
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{location.title}</h4>
                          {location.storefrontAddress && (
                            <p className="text-sm text-slate-600 mt-1">
                              {formatAddress(location)}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">ID: {location.locationId}</p>
                        </div>
                        {selectedLocationId === location.locationId && (
                          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLocation}
                  disabled={!selectedLocationId || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Location"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Successfully Connected!</h3>
              <p className="text-sm text-slate-600">
                Your Google Business Profile has been connected
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectGoogleBusinessProfile;

