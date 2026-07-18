import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button, Modal, Select } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import type { ReportReason, ReportTargetType } from "@/types";

const reasonOptions: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or fake listing" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misrepresented", label: "Item doesn't match description" },
  { value: "no_show", label: "User didn't show up" },
  { value: "other", label: "Other" },
];

export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const push = useToastStore((s) => s.push);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");

  const report = useMutation({
    mutationFn: () => apiClient.submitReport({ targetType, targetId, reason, detail: detail || undefined }),
    onSuccess: () => {
      push("Report submitted. We'll review it within 48 hours.", "success");
      onClose();
    },
    onError: (err) =>
      push(err instanceof ApiClientError ? err.message : "Couldn't submit your report. Please try again.", "error"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Report this listing">
      <div className="flex flex-col gap-4">
        <Select
          label="Reason"
          options={reasonOptions}
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-800">Details (optional)</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-paper-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-500"
            placeholder="Any additional context…"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={report.isPending} onClick={() => report.mutate()}>
            Submit report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
