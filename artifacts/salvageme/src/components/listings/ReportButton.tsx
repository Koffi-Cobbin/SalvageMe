import { Flag } from "lucide-react";
import { useState } from "react";
import { ReportModal } from "./ReportModal";
import type { ReportTargetType } from "@/types";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-ink-700/50 hover:text-rose-600"
        aria-label="Report this listing"
      >
        <Flag size={13} aria-hidden="true" />
        Report
      </button>
      <ReportModal
        open={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
      />
    </>
  );
}
