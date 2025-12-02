import { useEffect } from "react";
import LoadingState from "@/components/common/LoadingState";

const GoogleBusinessProfileCallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gbpConnected = urlParams.get("gbp_connected");
    const error = urlParams.get("error");

    // Send message to parent window
    if (window.opener) {
      if (gbpConnected) {
        window.opener.postMessage(
          { type: "GBP_OAUTH_SUCCESS", projectId: gbpConnected },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          { type: "GBP_OAUTH_ERROR", error: decodeURIComponent(error) },
          window.location.origin
        );
      }
      // Close popup
      window.close();
    } else {
      // If no opener (direct navigation), redirect to dashboard
      window.location.href = gbpConnected
        ? `/dashboard?gbp_connected=${gbpConnected}`
        : `/dashboard${error ? `?error=${error}` : ""}`;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing Google Business Profile connection..." />
    </div>
  );
};

export default GoogleBusinessProfileCallbackPage;
