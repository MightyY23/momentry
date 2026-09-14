import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/useAuth";

/**
 * Wraps guest-only routes (e.g. /auth).
 * Signed-in users are sent to /home so
 * they never see the login screen again.
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default PublicRoute;
