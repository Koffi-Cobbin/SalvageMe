# SalvageMe — Frontend

A community book exchange platform connecting book donors with students and families in Ghana —
free, peer-to-peer, no middlemen. This repo is a pnpm workspace containing the production frontend
(`artifacts/salvageme`, React + Vite) plus a small set of shared backend-facing packages under `lib/`.

The frontend talks to an external Django REST API at `https://salvageme.pythonanywhere.com/api/v1`.
`API_REFERENCE.md` in this repo is the hand-written contract that integration was built against.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React 18, Vite 7, Tailwind CSS v4 (CSS-first — design tokens live in `src/index.css`,
  there is no `tailwind.config.js`)
- **Routing**: Wouter v3
- **State**: Zustand (auth session, toast notifications)
- **Data fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod + `@hookform/resolvers`
- **Icons**: Lucide React
- **Image compression**: `browser-image-compression`

## Requirements

- Node.js 24
- **pnpm only** — a `preinstall` script blocks `npm install`/`yarn install` and refuses to run.
  Install pnpm globally (`npm install -g pnpm`) before doing anything else in this repo.

## Setup

```bash
pnpm install
pnpm run dev
```

The dev server needs `PORT` and `BASE_PATH` set — the `dev` script already sets sane local defaults
via `cross-env`, so the command above works as-is with no extra environment setup. Visit
`http://localhost:3000`.

**Running from root vs. the app folder**: `pnpm run dev` from the repo root is a shortcut for
`pnpm --filter @workspace/salvageme run dev` — use it from anywhere in the repo. If you're already
`cd`'d into `artifacts/salvageme/`, just run `pnpm run dev` there directly instead — same result,
just resolves to the app's own `dev` script rather than the root-level passthrough.

### Windows notes

- If `preinstall` fails with `'sh' is not recognized`, point npm/pnpm at Git Bash's shell once:
  add `script-shell=C:/Program Files/Git/bin/bash.exe` to your user `.npmrc`
  (`C:\Users\<you>\.npmrc`), or run `pnpm config set script-shell "C:/Program Files/Git/bin/bash.exe"`.
- Once that's set, all pnpm scripts run through Git Bash's MSYS layer, which auto-converts
  Unix-style path arguments (like `BASE_PATH=/`) into Windows paths. If you see the dev server come
  up at a mangled URL instead of `http://localhost:3000/`, set `MSYS_NO_PATHCONV=1` as a permanent
  user environment variable.
- Rollup, esbuild, lightningcss, and `@tailwindcss/oxide` ship OS-specific native binaries. This repo's
  `pnpm-workspace.yaml` excludes platform binaries the Replit deploy target doesn't need, but keeps
  `win32-x64` enabled for local Windows development. If you're on `arm64` Windows, you'll need to
  re-enable the corresponding `win32-arm64` override entries yourself.

## Environment variables

Set these in `artifacts/salvageme/.env` (or `.env.local`, `.env.<mode>` — standard Vite loading rules).
Neither is required for a default `mock`-mode dev run.

| Variable | Purpose |
|---|---|
| `VITE_API_MODE` | `"mock"` (default) — in-memory dataset, no network calls, works without any backend/CORS setup. `"live"` — hits the real Django backend. |
| `VITE_API_BASE_URL` | Base URL of the Django API, including `/api/v1`. Defaults to `https://salvageme.pythonanywhere.com/api/v1`. |

**CORS gotcha when using `live` mode**: the deployed Django backend does not whitelist
`localhost`/`127.0.0.1` by default, and this app's API client sends `credentials: "include"` on every
request (cookie-based refresh token), which requires Django to echo back an exact allowed origin rather
than `*`. You'll need `CORS_ALLOWED_ORIGINS` (and `CORS_ALLOW_CREDENTIALS = True`) on the backend to
include your dev origin before `live` mode will work locally.

## Swapping the mock adapter for the live API

All data access goes through `src/lib/api-client.ts`, which exports a single `apiClient` implementing
the `ApiAdapter` interface. Two implementations exist:

- `mockAdapter` (`src/lib/mock-adapter.ts`) — in-memory, seeded sample data, used by default.
- `createLiveAdapter(baseUrl, healthBaseUrl)` — real `fetch` calls to the Django API, converting between
  the API's snake_case wire format and this app's camelCase types, with automatic silent-refresh on 401s.

No component or page imports either implementation directly — they all import `apiClient`, so switching
modes is purely an environment-variable change (see above).

## Scripts

```bash
pnpm --filter @workspace/salvageme run dev         # local dev server
pnpm --filter @workspace/salvageme run build        # production build (outputs to dist/public)
pnpm --filter @workspace/salvageme run serve        # preview a production build locally
pnpm --filter @workspace/salvageme run typecheck    # tsc --noEmit

pnpm run build       # typecheck + build everything in the workspace
pnpm run typecheck   # typecheck everything in the workspace
```

## Project structure

```
artifacts/
  salvageme/          ← React + Vite web app (the production frontend)
    src/
      pages/          ← route-level page components
      components/
        ui/           ← custom UI primitives (Button, Card, Badge, Modal, Toast…) — no shadcn
        layout/       ← SiteHeader, SiteFooter, NavigationProgress
        listings/     ← ListingCard, ListingFilters, PhotoPicker, ReportButton…
        gallery/      ← GalleryGrid
      lib/
        api-client.ts       ← API adapter (mock ↔ live toggle)
        mock-adapter.ts     ← in-memory mock dataset
        auth.ts             ← bootstrapSession, login, register, logout
        stores/             ← Zustand stores (session-store, toast-store)
        content/gallery.ts  ← static gallery items — no backend endpoint for this yet, see below
      types/index.ts        ← all domain types (Listing, Exchange, User…)
      App.tsx               ← router, QueryClient, AuthGuard, ScrollToTop
      index.css             ← Tailwind v4 @theme tokens (palette, fonts, sizes)
    public/
      logo.png
      gallery/              ← sample-1/2/3.jpg placeholder impact photos
lib/
  api-zod/            ← shared Zod schemas / generated types
  api-spec/           ← OpenAPI schema for the Django backend
  db/                 ← Drizzle ORM schema + Postgres connection
scripts/              ← workspace-level dev/CI scripts (e.g. post-merge DB push)
```

`artifacts/salvageme` has no workspace-internal dependencies — it only depends on external npm
packages. The `lib/*` packages exist for other/future backend-facing tooling in this workspace and
are not required to build or run the frontend.

## Design system

Design tokens (palette, fonts, spacing, radii) live entirely in the `@theme inline` block inside
`artifacts/salvageme/src/index.css` — there is no `tailwind.config.js`. UI primitives are hand-rolled
under `components/ui/` rather than shadcn, to avoid TypeScript casing-collision issues on
case-insensitive filesystems.

## Product

Two user roles — **donors** and **recipients** — covering the full exchange lifecycle:

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

## Architecture notes

- **Wouter, not a Next.js router** — this app was migrated off Next.js/Vercel onto Vite; routing uses
  Wouter v3 (`<Link>`, `useLocation`, `useSearch`, `useParams`).
- **AuthGuard component** replaces Next.js middleware — reads `useSessionStore` and redirects
  unauthenticated users to `/login?returnTo=<path>`.
- **ScrollToTop** is wired into the Wouter `<Router>` and calls `window.scrollTo({ top: 0, behavior:
  "instant" })` on every location change.
- **Impact/activities gallery has no backend or self-serve upload yet** — `src/lib/content/gallery.ts`
  plus static files in `public/gallery/` are editable config; adding a real photo currently requires a
  code change and redeploy, not something non-developers can do. See `API_REFERENCE.md` — it covers
  listings/exchanges/stats but not a photo library endpoint.

## Gotchas

- **CORS in dev** — always use `VITE_API_MODE=mock` locally unless the backend has whitelisted your
  origin (see Environment variables above).
- **`PORT` and `BASE_PATH` are required** — `vite.config.ts` throws on startup if either is unset. The
  `dev` script sets both via `cross-env`; if you're running `vite` directly, set them yourself.
- **PascalCase UI components** — `components/ui/` uses PascalCase filenames (`Button.tsx`, not
  `button.tsx`). `forceConsistentCasingInFileNames` is enabled in `tsconfig.base.json`; lowercase
  imports will fail the build.

## Contributing

See `API_REFERENCE.md` for the backend contract this frontend integrates against.
