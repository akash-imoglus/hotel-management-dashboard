import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { persistToken } from "@/lib/auth";
import LoadingState from "@/components/common/LoadingState";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (token) {
        try {
          // Store token properly using the auth utility
          persistToken(token, true);

          // If user data is provided, we can use it, but let AuthContext fetch to ensure consistency
          // Refresh the user data from the server
          await refreshUser();

          // Clean up URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);

          // Navigate to dashboard
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Error handling Google OAuth callback:', error);
          navigate('/login', { replace: true, state: { error: 'Authentication failed. Please try again.' } });
        }
      } else {
        // No token, redirect to login
        navigate('/login', { replace: true, state: { error: 'No authentication token received.' } });
      }
    };

    void handleCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hotel-foam via-white to-slate-50">
      <LoadingState message="Completing authentication..." />
    </div>
  );
};

export default GoogleCallbackPage;
