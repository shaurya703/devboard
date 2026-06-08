import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Centralized query keys so cache invalidation stays consistent. */
export const queryKeys = {
  me: ["me"] as const,
  boards: ["boards"] as const,
  board: (id: string) => ["board", id] as const,
  activity: (id: string) => ["activity", id] as const,
  members: (id: string) => ["members", id] as const,
};
