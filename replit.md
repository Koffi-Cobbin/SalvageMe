# SalvageMe

A community book exchange platform connecting book donors with students and families in Ghana — completely free, peer-to-peer, no middlemen.

## Run & Operate

```bash
# Start the web frontend (auto-started by the "salvageme: web" workflow)
pnpm --filter @workspace/salvageme run dev

# Typecheck the frontend
pnpm --filter @workspace/salvageme run typecheck

# Typecheck everything
pnpm run typecheck

# Build everything
pnpm run build
```

### API mode

The frontend talks to an external Django REST API at `https://salvageme.pythonanywhere.com/api/v1`.

| `VITE_API_MODE` | Behaviour |
|---|---|
| `mock` (default) | In-memory dataset — no network calls, works without CORS config |
| `live` | Hits the real Django backend |

Set `VITE_API_MODE=live` as a Replit Secret to switch to the live backend. You'll also need the Django backend to whitelist the deployed Replit domain in `CORS_ALLOWED_ORIGINS`.

Optional env var: `VITE_API_BASE_URL` (defaults to `https://salvageme.pythonanywhere.com/api/v1`).

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React 18, Vite 7, Tailwind CSS v4 (CSS-first, no config file)
- **Routing**: Wouter v3 (replaces Next.js `Link`, `useRouter`, `useParams`, etc.)
- **State**: Zustand (auth session, toast notifications)
- **Data fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod + `@hookform/resolvers`
- **Icons**: Lucide React
- **Image compression**: `browser-image-compression`

## Where things live

```
artifacts/
  salvageme/          ← React + Vite web app (the main product)
    src/
      pages/          ← 15 route-level page components
      components/
        ui/           ← Custom UI primitives (Button, Card, Badge, Modal, Toast…)
        layout/       ← SiteHeader, SiteFooter, NavigationProgress
        listings/     ← ListingCard, ListingFilters, PhotoPicker, ReportButton…
        gallery/      ← GalleryGrid
      lib/
        api-client.ts       ← API adapter (mock ↔ live toggle)
        mock-adapter.ts     ← In-memory mock dataset
        auth.ts             ← bootstrapSession, login, register, logout
        stores/             ← Zustand stores (session-store, toast-store)
        content/gallery.ts  ← Static gallery items
      types/index.ts        ← All domain types (Listing, Exchange, User…)
      App.tsx               ← Router, QueryClient, AuthGuard, ScrollToTop
      index.css             ← Tailwind v4 @theme tokens (palette, fonts, sizes)
    public/
      logo.png
      gallery/              ← sample-1/2/3.jpg impact photos
  api-server/         ← Scaffold placeholder (not used by salvageme)
  mockup-sandbox/     ← Design component preview server
lib/
  api-zod/            ← Shared Zod schemas / generated types
  db/                 ← Drizzle ORM schema + Postgres connection
```

## Architecture decisions

- **Wouter instead of Next.js router** — the original app was Next.js/Vercel; porting to Vite required replacing `next/link`, `useRouter`, `useSearchParams`, and `usePathname` with Wouter v3 equivalents (`<Link>`, `useLocation`, `useSearch`, `useParams`).
- **Mock adapter as default** — the Django backend at pythonanywhere.com blocks requests from Replit's dev origin (CORS). `VITE_API_MODE=mock` lets the app run fully in-browser during development without any backend config.
- **Tailwind v4 CSS-first** — all design tokens (palette, fonts, spacing, radii) live in the `@theme inline` block inside `src/index.css`. There is no `tailwind.config.js`.
- **Custom UI components, no shadcn** — the app ships its own `Button`, `Card`, `Badge`, `Modal`, `Toast`, etc. under `components/ui/`. The scaffold's shadcn lowercase files were removed to avoid TypeScript casing-collision errors on case-insensitive filesystems.
- **AuthGuard component** — replaces Next.js `middleware.ts`. Reads `useSessionStore` and redirects unauthenticated users to `/login?returnTo=<path>`.
- **ScrollToTop** — a lightweight component wired into the Wouter `<Router>` that calls `window.scrollTo({ top: 0, behavior: "instant" })` on every location change.

## Product

SalvageMe has two user roles — **donors** and **recipients** — and covers the full exchange lifecycle:

| Screen | Path |
|---|---|
| Browse books | `/listings` |
| Book detail + request | `/listings/:id` |
| New listing (3-step form) | `/listings/new` |
| Edit / delete listing | `/listings/:id/edit` |
| My dashboard | `/dashboard` |
| Exchanges | `/exchanges`, `/exchanges/:id` |
| Requests (incoming + sent) | `/requests` |
| Profile settings | `/settings` |
| How it works | `/how-it-works` |
| Gallery | `/gallery` |
| FAQ | `/faq` |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **CORS in dev** — the live Django backend rejects requests from `localhost`/`127.0.0.1`. Always use `VITE_API_MODE=mock` locally (this is the default). Only switch to `live` after the deployed Replit domain is added to Django's `CORS_ALLOWED_ORIGINS`.
- **PORT env var required** — `vite.config.ts` reads `process.env.PORT` (assigned by Replit). Do not hardcode a port; the workflow injects it automatically.
- **PascalCase UI components** — `components/ui/` uses PascalCase filenames (`Button.tsx`, not `button.tsx`). TypeScript's `forceConsistentCasingInFileNames` is enabled; lowercase imports will cause build errors.
- **No `@workspace/api-client-react`** — this shared package was removed; the app uses its own `lib/api-client.ts`. Don't add it back.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
- See `.agents/memory/` for durable agent notes across sessions.
