import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/cn";

const styles = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-slate-800",
};

/** Fixed-position toast stack, driven by the UI store. */
export function Toaster() {
  const { toasts, dismissToast } = useUiStore();
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={cn(
            "max-w-xs rounded-md px-4 py-2 text-left text-sm text-white shadow-lg",
            styles[t.variant]
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
