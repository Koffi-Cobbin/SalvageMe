import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-paper-300 bg-paper-100 px-6 py-14 text-center">
      <Icon size={36} className="text-terracotta-500" aria-hidden="true" />
      <h3 className="text-display-sm font-display text-xl font-semibold text-ink-900">{title}</h3>
      <p className="max-w-sm text-sm text-ink-700/80">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
