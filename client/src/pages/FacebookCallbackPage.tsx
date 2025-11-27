import { useEffect } from "react";
import LoadingState from "@/components/common/LoadingState";

const FacebookCallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const facebookConnected = urlParams.get("facebook_connected");
    const error = urlParams.get("error");

    // Send message to parent window
    if (window.opener) {
      if (facebookConnected) {
        window.opener.postMessage(
          { type: "FACEBOOK_OAUTH_SUCCESS", projectId: facebookConnected },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          { type: "FACEBOOK_OAUTH_ERROR", error: decodeURIComponent(error) },
          window.location.origin
        );
      }
      // Close popup
      window.close();
    } else {
      // If no opener (direct navigation), redirect to dashboard
      window.location.href = facebookConnected
        ? `/dashboard?facebook_connected=${facebookConnected}`
        : `/dashboard${error ? `?error=${error}` : ""}`;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing Facebook connection..." />
    </div>
  );
};

export default FacebookCallbackPage;

