import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useSessionStore } from "@/lib/stores/session-store";
import { Button } from "@/components/ui";

const navLinks = [
  { href: "/listings", label: "Browse Books" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { status } = useSessionStore();

  return (
    <header className="sticky top-0 z-40 border-b border-paper-300 bg-paper-50/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-terracotta-500 px-3 py-2 text-white"
      >
        Skip to main content
      </a>
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900 no-underline"
        >
          <img src="/logo.png" alt="SalvageMe" width={36} height={36} className="rounded-md" />
          SalvageMe
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-700 hover:text-terracotta-600 no-underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {status === "authenticated" ? (
            <>
              <Link
                href="/requests"
                className="text-sm font-medium text-ink-700 hover:text-terracotta-600 no-underline"
              >
                Requests
              </Link>
              <Link
                href="/exchanges"
                className="text-sm font-medium text-ink-700 hover:text-terracotta-600 no-underline"
              >
                Exchanges
              </Link>
              {/*
                Note: the admin nav link was intentionally removed here.
                Admin access now lives entirely in the separate
                salvageme-admin app (its own origin/URL); this app no longer
                fetches admin capability state at all. See
                admin-app-isolation-plan.md §4 Phase 5 / §5.
              */}
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-ink-700 hover:text-terracotta-600 no-underline"
              >
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm">Give or Get Books</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-paper-300 bg-paper-50 md:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col gap-1 py-3">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-paper-200 no-underline"
              >
                {l.label}
              </Link>
            ))}
            {status === "authenticated" ? (
              <>
                <Link
                  href="/requests"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-paper-200 no-underline"
                >
                  Requests
                </Link>
                <Link
                  href="/exchanges"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-paper-200 no-underline"
                >
                  Exchanges
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-semibold text-terracotta-600 no-underline"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-paper-200 no-underline"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-semibold text-terracotta-600 no-underline"
                >
                  Give or Get Books
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
