import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { LoadingState } from "@/components/States";

/** Gate authenticated routes; redirect to /login when signed out. */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingState label="Restoring your session…" />
      </div>
    );
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

/** For auth pages: bounce already-signed-in users to the app. */
export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === "authenticated") return <Navigate to="/boards" replace />;
  return <Outlet />;
}
