import { CheckCircle2, Clock, XCircle, ShieldCheck, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import type { ListingStatus, ListingCondition } from "@/types";

type BadgeTone = "moss" | "amber" | "rose" | "clay" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  moss: "bg-moss-50 text-moss-600 border-moss-300",
  amber: "bg-amber-100 text-amber-700 border-amber-500/40",
  rose: "bg-rose-100 text-rose-700 border-rose-500/40",
  clay: "bg-clay-50 text-clay-600 border-clay-400/40",
  neutral: "bg-paper-200 text-ink-700 border-paper-300",
};

function Badge({
  tone,
  icon: Icon,
  children,
}: {
  tone: BadgeTone;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}

const statusMap: Record<ListingStatus, { tone: BadgeTone; icon: LucideIcon; label: string }> = {
  available: { tone: "moss", icon: CheckCircle2, label: "Available" },
  pending: { tone: "amber", icon: Clock, label: "Pending" },
  claimed: { tone: "rose", icon: XCircle, label: "Claimed" },
  removed: { tone: "neutral", icon: XCircle, label: "Removed" },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const { tone, icon, label } = statusMap[status];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}

const conditionLabel: Record<ListingCondition, string> = {
  new: "New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
};

export function ConditionBadge({ condition }: { condition: ListingCondition }) {
  return <Badge tone="clay">{conditionLabel[condition]}</Badge>;
}

export function VerifiedBadge() {
  return (
    <Badge tone="moss" icon={ShieldCheck}>
      Verified
    </Badge>
  );
}

export { Badge };
