import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { clsx } from "clsx";
import { useToastStore } from "@/lib/stores/toast-store";
import type { Toast, ToastVariant } from "@/lib/stores/toast-store";

const iconMap: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const toneMap: Record<ToastVariant, string> = {
  success: "bg-moss-50 border-moss-300 text-moss-600",
  error: "bg-rose-100 border-rose-500/40 text-rose-700",
  info: "bg-paper-100 border-paper-300 text-ink-800",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = iconMap[toast.variant];

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      className={clsx(
        "flex items-center gap-2.5 rounded-lg border px-4 py-3 [box-shadow:0_2px_10px_rgba(29,26,21,0.06)]",
        toneMap[toast.variant],
      )}
    >
      <Icon size={18} aria-hidden="true" />
      <p className="text-sm font-medium">{toast.message}</p>
      <button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="ml-2">
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
