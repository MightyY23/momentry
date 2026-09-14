import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/useAuth";

/**
 * Blocks private routes from unauthenticated
 * visitors and remembers where the user was
 * heading so they can be returned there after
 * signing in.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem",
          color: "#7a173b",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
