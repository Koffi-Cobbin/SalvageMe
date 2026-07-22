import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui";

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
}

export function ActionModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Required",
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading = false,
}: ActionModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const canConfirm = !requireReason || reason.trim().length > 0;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && (
        <p className="mb-4 text-sm text-ink-700/80">{description}</p>
      )}
      {requireReason && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-900">
            {reasonLabel} <span className="text-terracotta-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={reasonPlaceholder}
            className="w-full rounded-xl border border-paper-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder-ink-700/40 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
          />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          size="sm"
          loading={loading}
          disabled={!canConfirm}
          onClick={() => onConfirm(reason || undefined)}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
