"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { ReportModal } from "./ReportModal";
import type { ReportTargetType } from "@/types";

export function ReportButton({ targetType, targetId }: { targetType: ReportTargetType; targetId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-700/70 hover:text-rose-700"
      >
        <Flag size={14} aria-hidden="true" />
        Report this {targetType}
      </button>
      <ReportModal open={open} onClose={() => setOpen(false)} targetType={targetType} targetId={targetId} />
    </>
  );
}
