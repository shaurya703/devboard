import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { AuthResponse } from "@devboard/shared";
import { authApi } from "./auth.api";
import { useAuthStore } from "@/stores/authStore";
import { API_URL } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { disconnectSocket } from "@/lib/socket";

/**
 * On app start, attempt a silent login using the refresh-token cookie.
 * Sets auth status to authenticated/unauthenticated accordingly.
 */
export function useInitAuth() {
  const { setSession, setStatus } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.post<{ success: boolean; data: AuthResponse }>(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (!cancelled && res.data.success) {
          setSession(res.data.data.user, res.data.data.accessToken);
        } else if (!cancelled) {
          setStatus("unauthenticated");
        }
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setSession, setStatus]);
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clear();
      disconnectSocket();
      queryClient.clear();
    },
  });
}
