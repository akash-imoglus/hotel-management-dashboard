import { useEffect } from "react";
import LoadingState from "@/components/common/LoadingState";

const GoogleSearchConsoleCallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchConsoleConnected = urlParams.get("search_console_connected");
    const error = urlParams.get("error");

    // Send message to parent window
    if (window.opener) {
      if (searchConsoleConnected) {
        window.opener.postMessage(
          { type: "GOOGLE_SEARCH_CONSOLE_OAUTH_SUCCESS", projectId: searchConsoleConnected },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          { type: "GOOGLE_SEARCH_CONSOLE_OAUTH_ERROR", error: decodeURIComponent(error) },
          window.location.origin
        );
      }
      // Close popup
      window.close();
    } else {
      // If no opener (direct navigation), redirect to dashboard
      window.location.href = searchConsoleConnected
        ? `/dashboard?search_console_connected=${searchConsoleConnected}`
        : `/dashboard${error ? `?error=${error}` : ""}`;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing Google Search Console connection..." />
    </div>
  );
};

export default GoogleSearchConsoleCallbackPage;


