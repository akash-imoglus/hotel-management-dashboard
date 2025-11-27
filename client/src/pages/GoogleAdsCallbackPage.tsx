import { useEffect } from "react";
import LoadingState from "@/components/common/LoadingState";

const GoogleAdsCallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const adsConnected = urlParams.get("ads_connected");
    const error = urlParams.get("error");

    // Send message to parent window
    if (window.opener) {
      if (adsConnected) {
        window.opener.postMessage(
          { type: "GOOGLE_ADS_OAUTH_SUCCESS", projectId: adsConnected },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          { type: "GOOGLE_ADS_OAUTH_ERROR", error: decodeURIComponent(error) },
          window.location.origin
        );
      }
      // Close popup
      window.close();
    } else {
      // If no opener (direct navigation), redirect to dashboard
      window.location.href = adsConnected
        ? `/dashboard?ads_connected=${adsConnected}`
        : `/dashboard${error ? `?error=${error}` : ""}`;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing Google Ads connection..." />
    </div>
  );
};

export default GoogleAdsCallbackPage;


