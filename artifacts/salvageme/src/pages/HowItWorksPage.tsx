import { Link } from "wouter";
import { BookOpen, RefreshCw, Shield, MapPin, Star, UserCheck } from "lucide-react";
import { Button } from "@/components/ui";

const steps = [
  {
    icon: BookOpen,
    title: "List a book",
    body: "Donors photograph their book, pick a condition rating and category, and post. Takes under two minutes.",
  },
  {
    icon: UserCheck,
    title: "Someone requests it",
    body: "Families and students browse listings. When they find something useful, they send a short request with an optional note.",
  },
  {
    icon: RefreshCw,
    title: "Accept and schedule",
    body: "Donors review the request and, if happy, accept it. Both parties then pick a time — either at a listed community drop-off point or directly.",
  },
  {
    icon: MapPin,
    title: "Hand off the book",
    body: "Meet at the agreed spot. No cash, no courier, no complication. Just two neighbours sharing something useful.",
  },
  {
    icon: Shield,
    title: "Close the loop",
    body: "After the hand-off, mark the exchange complete. Both parties can leave a short rating so the community stays trustworthy.",
  },
  {
    icon: Star,
    title: "Build a reputation",
    body: "Ratings and verified badges show who's reliable. Great donors and recipients stand out and get priority when books are scarce.",
  },
];

export function HowItWorksPage() {
  return (
    <div className="py-16">
      <div className="container-page max-w-3xl">
        <h1 className="text-display-md">How SalvageMe works</h1>
        <p className="mt-4 max-w-lg text-ink-700/80">
          SalvageMe is a peer-to-peer book exchange. No middlemen, no fees, no warehouses —
          just neighbours helping neighbours get the books they need.
        </p>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-500">
                <Icon size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="mb-1 font-semibold text-ink-900">
                  <span className="mr-1 text-terracotta-500">{i + 1}.</span> {title}
                </p>
                <p className="text-sm text-ink-700/80">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 rounded-xl2 bg-paper-100 p-8 text-center">
          <h2 className="mb-3 font-display text-display-sm text-ink-900">Ready to get started?</h2>
          <p className="mb-6 text-sm text-ink-700/80">
            It takes less than two minutes to list your first book or request one.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/register"><Button>Create an account</Button></Link>
            <Link href="/listings"><Button variant="secondary">Browse books first</Button></Link>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="mb-6 text-display-sm">Trust &amp; Safety</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Verified accounts", body: "Phone and email verification keeps the community accountable." },
              { title: "Condition ratings", body: "Donors rate their books honestly — misleading listings can be reported." },
              { title: "Exchange records", body: "Every hand-off is logged so disputes have a clear paper trail." },
              { title: "Community moderation", body: "Reports are reviewed promptly. Repeat bad actors lose access." },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl border border-paper-300 bg-white p-4">
                <p className="font-semibold text-ink-900">{title}</p>
                <p className="mt-1 text-sm text-ink-700/80">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
