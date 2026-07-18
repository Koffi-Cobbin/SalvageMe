"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button, Modal, Select, Input } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";
import type { ReportReason, ReportTargetType } from "@/types";

const reasonOptions: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misrepresented", label: "Misrepresented (not as described)" },
  { value: "no_show", label: "No-show at an exchange" },
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
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const push = useToastStore((s) => s.push);

  const mutation = useMutation({
    mutationFn: () => apiClient.submitReport({ targetType, targetId, reason, detail: detail || undefined }),
    onSuccess: () => {
      push("Thanks — our team will review this report.", "success");
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "duplicate_report") {
        push("You already have an open report on this — our team is reviewing it.", "info");
        onClose();
        return;
      }
      push(err instanceof ApiClientError ? err.message : "Couldn't submit your report.", "error");
    },
  });

  return (
    <Modal open={open} onClose={onClose} title={`Report this ${targetType}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <Select
          label="Reason"
          options={reasonOptions}
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
        />
        <Input label="Additional detail (optional)" value={detail} onChange={(e) => setDetail(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={mutation.isPending}>
            Submit report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
