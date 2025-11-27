import { useEffect } from "react";
import LoadingState from "@/components/common/LoadingState";

const MetaAdsCallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const metaAdsConnected = urlParams.get("meta_ads_connected");
    const error = urlParams.get("error");

    // Send message to parent window
    if (window.opener) {
      if (metaAdsConnected) {
        window.opener.postMessage(
          { type: "META_ADS_OAUTH_SUCCESS", projectId: metaAdsConnected },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          { type: "META_ADS_OAUTH_ERROR", error: decodeURIComponent(error) },
          window.location.origin
        );
      }
      // Close popup
      window.close();
    } else {
      // If no opener (direct navigation), redirect to dashboard
      window.location.href = metaAdsConnected
        ? `/dashboard?meta_ads_connected=${metaAdsConnected}`
        : `/dashboard${error ? `?error=${error}` : ""}`;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing Meta Ads connection..." />
    </div>
  );
};

export default MetaAdsCallbackPage;

