import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { Spinner } from "@/ui";

export function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        className="flex min-h-[60vh] items-center justify-center px-6 py-24 text-ember"
      >
        <Spinner size="lg" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (admin && !isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
