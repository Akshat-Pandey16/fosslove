import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/auth/useAuth";

export function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <p aria-busy="true">Loading…</p>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (admin && !isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
