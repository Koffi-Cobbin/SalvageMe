import { Link } from "wouter";
import { ArrowRight, BookOpen, RefreshCw, Shield, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui";
import { ListingCard } from "@/components/listings/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-display text-5xl font-extrabold text-terracotta-500 leading-none">{value}</span>
      <span className="mt-2 text-base font-medium text-ink-700/80">{label}</span>
    </div>
  );
}

export function HomePage() {
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", "recent"],
    queryFn: () => apiClient.listListings({ pageSize: 6 }),
  });
  const { data: stats } = useQuery({
    queryKey: ["impact-stats"],
    queryFn: () => apiClient.getImpactStats(),
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-paper-100 pb-20 pt-16">
        <div className="container-page text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-terracotta-500">
            Community book exchange
          </p>
          <h1 className="font-display text-display-lg font-bold text-ink-900 sm:text-5xl lg:text-6xl">
            Books that deserve<br className="hidden sm:block" /> a second read
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-ink-700/80">
            SalvageMe connects book donors with students and families who can use them —
            completely free, in your neighbourhood.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/listings">
              <Button size="lg">
                Browse books <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Donate your books
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      {stats && (
        <section className="border-y border-paper-300 bg-white py-12">
          <div className="container-page grid grid-cols-2 gap-8 sm:grid-cols-4">
            <StatBlock value={stats.totalListings.toLocaleString()} label="Books listed" />
            <StatBlock value={stats.totalExchangesCompleted.toLocaleString()} label="Exchanges completed" />
            <StatBlock value={stats.totalActiveDonors.toLocaleString()} label="Active donors" />
            <StatBlock value={stats.totalActiveRecipients.toLocaleString()} label="Families helped" />
          </div>
        </section>
      )}

      {/* Recent listings */}
      <section className="py-16">
        <div className="container-page">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="font-display text-display-md text-ink-900 shrink-0">Recently listed</h2>
            <Link href="/listings" className="flex shrink-0 items-center gap-1 text-sm font-medium text-terracotta-600 hover:underline no-underline whitespace-nowrap">
              See all <ArrowRight size={15} />
            </Link>
          </div>

          {listingsLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl2 border border-paper-300 bg-white p-3">
                  <Skeleton className="mb-3 h-44 w-full rounded-lg" />
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(listings?.results ?? []).map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works callout */}
      <section className="bg-paper-100 py-16">
        <div className="container-page">
          <h2 className="mb-10 text-center font-display text-display-md text-ink-900">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: BookOpen, step: "1", title: "List or browse", body: "Donors post books; families browse and request the ones they need." },
              { icon: RefreshCw, step: "2", title: "Arrange the hand-off", body: "Schedule a meet-up or drop off at a community point — no shipping, no costs." },
              { icon: Shield, step: "3", title: "Close the loop", body: "Mark the exchange complete and leave feedback so the community stays trustworthy." },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="relative flex flex-col items-center rounded-xl2 border border-paper-300 bg-white p-6 pt-8 text-center [box-shadow:0_2px_10px_rgba(29,26,21,0.06)]">
                <span className="absolute top-4 left-4 flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-50 text-xs font-bold text-terracotta-600">
                  {step}
                </span>
                <Icon size={32} strokeWidth={2.5} className="mb-4 text-terracotta-500" />
                <h3 className="mb-2 font-semibold text-ink-900">{title}</h3>
                <p className="text-sm text-ink-700/80">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/how-it-works">
              <Button variant="secondary">Learn more <ArrowRight size={16} /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-page max-w-2xl text-center">
          <TrendingUp size={40} className="mx-auto mb-4 text-terracotta-500" />
          <h2 className="font-display text-display-md text-ink-900">Every book donated matters</h2>
          <p className="mx-auto mt-4 max-w-md text-ink-700/80">
            A book sitting on a shelf could change a child's trajectory. Join thousands of
            neighbours making education more accessible, one exchange at a time.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/register"><Button>Get started</Button></Link>
            <Link href="/gallery"><Button variant="secondary">See the impact</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
