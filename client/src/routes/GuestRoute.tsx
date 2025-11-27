import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const GuestRoute = () => {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;

