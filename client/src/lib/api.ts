import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { ApiResponse, ApiFailure } from "@devboard/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * Access token lives in memory only (never localStorage) to limit XSS blast
 * radius. The refresh token is an httpOnly cookie the browser sends to
 * /api/auth/refresh automatically.
 */
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // send the refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// --- Silent refresh on 401 (single-flight) ---
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post<ApiResponse<{ accessToken: string }>>(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    if (res.data.success) {
      setAccessToken(res.data.data.accessToken);
      return res.data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const isAuthRoute = original?.url?.includes("/auth/");

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization =
          `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed: clear token so the app routes back to login.
      setAccessToken(null);
    }
    return Promise.reject(error);
  }
);

/** Narrowed error message from a failed API call, for toasts/forms. */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const axiosErr = err as AxiosError<ApiFailure>;
  return axiosErr.response?.data?.error?.message ?? fallback;
}

/** Field-level validation details, if the server returned any. */
export function getApiErrorDetails(
  err: unknown
): Record<string, string[]> | undefined {
  const axiosErr = err as AxiosError<ApiFailure>;
  return axiosErr.response?.data?.error?.details;
}

/** Unwrap the success envelope to the inner data. */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  if (!res.data.success) {
    throw new Error(res.data.error.message);
  }
  return res.data.data;
}

export { API_URL };
