"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { clsx } from "clsx";
import { useToastStore, type Toast as ToastType } from "@/lib/stores/toast-store";

const iconMap = { success: CheckCircle2, error: AlertCircle, info: Info };
const toneMap = {
  success: "bg-moss-50 text-moss-600 border-moss-300",
  error: "bg-rose-100 text-rose-700 border-rose-500/40",
  info: "bg-paper-100 text-ink-800 border-paper-300",
};

function ToastItem({ toast }: { toast: ToastType }) {
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
        "flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-card",
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
