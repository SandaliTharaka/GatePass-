import { Navigate, Outlet } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";
import { useEffect, useRef } from "react";

const ProtectedRoute = ({ allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userRoles = user?.roles || []; // Get array of roles
  const { showToast } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!hasShownToast.current) {
      if (!user || !user.token) {
        hasShownToast.current = true;
      } else if (!userRoles.some((role) => allowedRoles.includes(role))) {
        showToast(
          "Access denied. You don't have permission to view this page.",
          "error"
        );
        hasShownToast.current = true;
      }
    }
  }, [user, userRoles, allowedRoles, showToast]);

  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }

  // Check if user has any of the allowed roles
  if (!userRoles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
