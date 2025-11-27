import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import api from "@/lib/api";

const YouTubeCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const projectId = urlParams.get("projectId");
      const errorParam = urlParams.get("error");

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        if (window.opener) {
          window.opener.postMessage(
            { type: "YOUTUBE_OAUTH_ERROR", error: decodeURIComponent(errorParam) },
            window.location.origin
          );
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      if (!code || !projectId) {
        setError("Missing authorization code or project ID");
        if (window.opener) {
          window.opener.postMessage(
            { type: "YOUTUBE_OAUTH_ERROR", error: "Missing authorization code or project ID" },
            window.location.origin
          );
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      try {
        // Send code and projectId to backend
        await api.post("/youtube/callback", {
          code,
          projectId,
        });

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage(
            { type: "YOUTUBE_OAUTH_SUCCESS", projectId },
            window.location.origin
          );
          window.close();
        } else {
          // If no opener (direct navigation), redirect to dashboard
          navigate(`/dashboard/${projectId}/youtube?youtube_connected=true`);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || "Failed to connect YouTube";
        setError(errorMessage);
        
        if (window.opener) {
          window.opener.postMessage(
            { type: "YOUTUBE_OAUTH_ERROR", error: errorMessage },
            window.location.origin
          );
          setTimeout(() => window.close(), 2000);
        }
      }
    };

    void handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
        <div className="max-w-md">
          <ErrorState 
            description={error}
            onRetry={() => window.close()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing YouTube connection..." />
    </div>
  );
};

export default YouTubeCallbackPage;


