import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useLogout } from "@/features/auth/useAuth";
import { Button } from "./ui/Button";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/boards" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
            D
          </span>
          <span className="font-semibold text-slate-800">DevBoard</span>
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user.name}
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700"
              title={user.email}
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
