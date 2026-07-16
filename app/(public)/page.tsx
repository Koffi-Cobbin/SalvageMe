import Link from "next/link";
import { BookOpen, Users, HeartHandshake } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button, Card } from "@/components/ui";

export const revalidate = 3600; // ISR: impact stats refresh hourly

export default async function HomePage() {
  // Impact stats are a nice-to-have on this page, not critical content —
  // don't fail the whole page (or the build, for SSG/ISR) if the backend
  // is briefly unreachable. Falls back to a friendly placeholder instead.
  let stats: Awaited<ReturnType<typeof apiClient.getImpactStats>> | null = null;
  try {
    stats = await apiClient.getImpactStats();
  } catch {
    stats = null;
  }

  return (
    <>
      <section className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-display-md sm:text-display-lg">
            Every book has a next reader. Let&apos;s find them.
          </h1>
          <p className="mt-4 text-lg text-ink-700/90">
            SalvageMe connects people with books to give away to students, families, and schools
            who need them — free, local, and built for communities with the least access.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/listings">
              <Button size="lg" className="w-full sm:w-auto">Browse books near you</Button>
            </Link>
            <Link href="/listings/new">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">Give a book</Button>
            </Link>
          </div>
        </div>
      </section>

      {stats && (
        <section className="bg-paper-100 py-14">
          <div className="container-page grid gap-6 sm:grid-cols-3">
            <StatCard icon={BookOpen} value={stats.totalListings.toLocaleString()} label="Books listed" />
            <StatCard icon={HeartHandshake} value={stats.totalExchangesCompleted.toLocaleString()} label="Exchanges completed" />
            <StatCard icon={Users} value={(stats.totalActiveDonors + stats.totalActiveRecipients).toLocaleString()} label="Community members" />
          </div>
        </section>
      )}

      <section className="container-page py-16">
        <div className="mx-auto max-w-xl text-center">
          <HeartHandshake className="mx-auto mb-3 text-terracotta-500" size={32} aria-hidden="true" />
          <h2 className="text-display-sm">Built for the people who need it most</h2>
          <p className="mt-3 text-ink-700/90">
            No fees, no shipping costs, no clutter. Just a simple way to hand a book from someone
            who&apos;s done with it to someone who&apos;s about to fall in love with it — designed to work
            even on a slow connection and an older phone.
          </p>
        </div>
      </section>
    </>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 p-6 text-center">
      <Icon className="text-terracotta-500" size={28} aria-hidden="true" />
      <p className="text-display-md">{value}</p>
      <p className="text-sm text-ink-700/80">{label}</p>
    </Card>
  );
}
