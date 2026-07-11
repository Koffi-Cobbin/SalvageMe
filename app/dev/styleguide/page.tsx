import { notFound } from "next/navigation";
import { Button, Input, Select, Card, Avatar, ListingStatusBadge, ConditionBadge, VerifiedBadge, EmptyState, ListingCardSkeleton } from "@/components/ui";
import { BookMarked } from "lucide-react";

// Dev-only: excluded from production builds so it never ships publicly.
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="container-page flex flex-col gap-10 py-10">
      <h1 className="text-display-md">Style Guide</h1>

      <section>
        <h2 className="text-display-sm mb-4">Palette &amp; type</h2>
        <div className="flex flex-wrap gap-3">
          {["terracotta-500", "moss-500", "amber-500", "rose-500", "clay-600", "ink-900", "paper-200"].map((c) => (
            <div key={c} className={`h-16 w-24 rounded-lg bg-${c} flex items-end p-2 text-xs text-white`}>{c}</div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-display-sm mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section>
        <h2 className="text-display-sm mb-4">Form controls</h2>
        <div className="flex max-w-sm flex-col gap-4">
          <Input label="Title" placeholder="e.g. Intro to Algebra" />
          <Input label="With error" error="This field is required" />
          <Select label="Condition" options={[{ value: "good", label: "Good" }]} />
        </div>
      </section>

      <section>
        <h2 className="text-display-sm mb-4">Status &amp; badges</h2>
        <div className="flex flex-wrap gap-3">
          <ListingStatusBadge status="available" />
          <ListingStatusBadge status="pending" />
          <ListingStatusBadge status="claimed" />
          <ConditionBadge condition="like_new" />
          <VerifiedBadge />
        </div>
      </section>

      <section>
        <h2 className="text-display-sm mb-4">Avatar &amp; card</h2>
        <div className="flex items-center gap-4">
          <Avatar name="Ama Boateng" />
          <Card className="p-4">A basic card</Card>
        </div>
      </section>

      <section>
        <h2 className="text-display-sm mb-4">Empty state &amp; skeleton</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyState icon={BookMarked} title="No listings yet" description="This is what an empty state looks like." />
          <ListingCardSkeleton />
        </div>
      </section>
    </div>
  );
}
