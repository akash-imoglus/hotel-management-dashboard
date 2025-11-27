import { useEffect } from "react";
import LoadingState from "@/components/common/LoadingState";

const GoogleAnalyticsCallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gaConnected = urlParams.get("ga_connected");
    const error = urlParams.get("error");

    // Send message to parent window
    if (window.opener) {
      if (gaConnected) {
        window.opener.postMessage(
          { type: "GA_OAUTH_SUCCESS", projectId: gaConnected },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          { type: "GA_OAUTH_ERROR", error: decodeURIComponent(error) },
          window.location.origin
        );
      }
      // Close popup
      window.close();
    } else {
      // If no opener (direct navigation), redirect to dashboard
      window.location.href = gaConnected
        ? `/dashboard?ga_connected=${gaConnected}`
        : `/dashboard${error ? `?error=${error}` : ""}`;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing Google Analytics connection..." />
    </div>
  );
};

export default GoogleAnalyticsCallbackPage;




