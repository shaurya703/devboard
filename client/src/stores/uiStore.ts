import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  variant: "success" | "error" | "info";
}

interface UiState {
  toasts: Toast[];
  pushToast: (message: string, variant?: Toast["variant"]) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pushToast: (message, variant = "info") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    // Auto-dismiss after 4s.
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience helper usable outside React components. */
export const toast = {
  success: (m: string) => useUiStore.getState().pushToast(m, "success"),
  error: (m: string) => useUiStore.getState().pushToast(m, "error"),
  info: (m: string) => useUiStore.getState().pushToast(m, "info"),
};
