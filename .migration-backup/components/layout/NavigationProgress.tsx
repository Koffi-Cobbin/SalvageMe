"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Next.js App Router's `loading.tsx` is a Suspense fallback: it only shows
 * while a route segment is actually suspending, i.e. while a server
 * component's own `await` is pending. Every page under `(app)` is a client
 * component that fetches its data via TanStack Query *after* mounting —
 * React has already finished rendering an (empty) tree by the time that
 * fetch starts, so there's nothing left to suspend on and `loading.tsx`
 * never gets a chance to appear. Prefetched static pages have the same
 * "no visible loading state" symptom for the opposite reason: Next already
 * has the page ready before you click, so the transition is just instant.
 *
 * This component fixes the actual complaint — "clicking a nav link gives
 * no feedback" — with a mechanism that doesn't depend on Suspense at all:
 * a thin top-of-page progress bar that starts the instant an internal link
 * is clicked (via a global click listener) and finishes once the URL has
 * actually changed (via `usePathname`/`useSearchParams`). This covers
 * every case — static, SSR, and client-rendered pages alike.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const trickleRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hideRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      clearTimeout(hideRef.current);
      clearInterval(trickleRef.current);
      setVisible(true);
      setProgress(15);
      trickleRef.current = setInterval(() => {
        setProgress((p) => (p < 85 ? p + (85 - p) * 0.15 : p));
      }, 180);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The URL only changes once the new route has actually rendered — that's
  // our signal the navigation is complete, regardless of how it got there.
  useEffect(() => {
    clearInterval(trickleRef.current);
    setProgress((p) => (p > 0 ? 100 : 0));
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(hideRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1" aria-hidden="true">
      <div
        className="h-full bg-terracotta-500 shadow-[0_0_8px_rgba(217,104,63,0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
