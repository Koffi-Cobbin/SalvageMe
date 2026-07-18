import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-paper-300 bg-paper-100">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">SalvageMe</p>
          <p className="mt-2 text-sm text-ink-700/80">
            Getting books out of boxes and into hands that need them — one neighborhood at a time.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="mb-2 text-sm font-semibold text-ink-800">Explore</p>
          <ul className="flex flex-col gap-1.5 text-sm text-ink-700">
            <li><Link href="/listings" className="hover:text-terracotta-600 no-underline">Browse Books</Link></li>
            <li><Link href="/how-it-works" className="hover:text-terracotta-600 no-underline">How It Works</Link></li>
            <li><Link href="/gallery" className="hover:text-terracotta-600 no-underline">Gallery</Link></li>
            <li><Link href="/faq" className="hover:text-terracotta-600 no-underline">FAQ</Link></li>
          </ul>
        </nav>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink-800">Trust &amp; Safety</p>
          <p className="text-sm text-ink-700/80">
            Every exchange happens between real, verifiable community members. See something wrong?
            Report it from any listing.
          </p>
        </div>
      </div>
      <div className="border-t border-paper-300 py-4 text-center text-xs text-ink-700/60">
        © {new Date().getFullYear()} SalvageMe. Built for educational equity.
      </div>
    </footer>
  );
}
