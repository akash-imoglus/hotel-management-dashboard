import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const GoogleDriveCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const projectId = searchParams.get("projectId");

    if (success === "true" && projectId) {
      setStatus("success");
      setMessage("Google Drive connected successfully!");
      
      if (window.opener) {
        window.opener.postMessage({ type: "GOOGLE_DRIVE_AUTH_SUCCESS", projectId }, "*");
        setTimeout(() => window.close(), 1500);
      } else {
        setTimeout(() => navigate(`/dashboard/${projectId}`), 2000);
      }
    } else if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
      
      if (window.opener) {
        window.opener.postMessage({ type: "GOOGLE_DRIVE_AUTH_ERROR", error }, "*");
        setTimeout(() => window.close(), 3000);
      }
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Processing...
            </h1>
            <p className="text-slate-600">
              Completing Google Drive authorization
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Success!
            </h1>
            <p className="text-slate-600">{message}</p>
            <p className="text-sm text-slate-500 mt-4">
              This window will close automatically...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Authorization Failed
            </h1>
            <p className="text-slate-600">{message}</p>
            <p className="text-sm text-slate-500 mt-4">
              This window will close automatically...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleDriveCallbackPage;





