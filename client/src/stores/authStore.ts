import { create } from "zustand";
import { PublicUser } from "@devboard/shared";
import { setAccessToken } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: PublicUser | null;
  status: AuthStatus;
  /** Set the signed-in user + access token (after login/register/refresh). */
  setSession: (user: PublicUser, accessToken: string) => void;
  setUser: (user: PublicUser) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setSession: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, status: "authenticated" });
  },
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clear: () => {
    setAccessToken(null);
    set({ user: null, status: "unauthenticated" });
  },
}));
