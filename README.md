# SalvageMe — Frontend

A Next.js (App Router) frontend for SalvageMe, a community book exchange platform, integrated
against the real Django REST Framework backend at `https://salvageme.pythonanywhere.com/api/v1/`.
Built mobile-first, performance-conscious, and accessible, on the assumption that many users are
on low-end devices and slow connections.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`. By default this talks to the **live deployed backend**
(`NEXT_PUBLIC_API_MODE=live`, see `.env.example`). Set `NEXT_PUBLIC_API_MODE=mock` in `.env.local`
to develop against the in-memory mock adapter instead (no backend required).

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Django API, **including** `/api/v1`. Defaults to `https://salvageme.pythonanywhere.com/api/v1`. |
| `NEXT_PUBLIC_API_MODE` | `"live"` (default) or `"mock"`. |

## Swapping the mock adapter for the live API

All data access goes through `lib/api-client.ts`, which exports a single `apiClient` implementing the
`ApiAdapter` interface. Two implementations exist:

- `mockAdapter` (`lib/mock-adapter.ts`) — in-memory, seeded with sample listings, used for local dev.
- `createLiveAdapter(baseUrl, healthBaseUrl)` — real `fetch` calls to the Django API, converting between
  the API's snake_case wire format and this app's camelCase types, with automatic silent-refresh on 401s.

No component or page imports either implementation directly — they all import `apiClient`.

## Scripts

```bash
npm run dev         # local dev server
npm run build        # production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm test               # Vitest + React Testing Library
npm run test:e2e        # Playwright (requires a running dev server)
```

## Project structure

Route groups for `(public)`, `(auth)`, and `(app)` (the protected group, gated by `middleware.ts`), a
`components/ui` design system every other component consumes, and a typed API layer under `lib/`.
`API_REFERENCE.md` in this repo is the hand-written API contract this integration was built against.

## Design system

Custom design tokens live in `tailwind.config.ts` — a warm terracotta/moss/sand palette. Visually verify
all primitives at `/dev/styleguide` (excluded from production builds).

---

## Backend integration — what changed

This pass wired the previously mock-only frontend to the real API described in `API_REFERENCE.md`.
The real contract differs from the originally assumed one in several load-bearing ways, all reflected
in `types/index.ts` and `lib/api-client.ts`:

- **Auth is username-based**, not email — `POST /auth/login/` takes `{username, password}`. Login/register
  forms updated accordingly. A real `POST /auth/logout/` call now runs on sign-out.
- **The refresh token is a cross-origin httpOnly cookie** (`salvageme_refresh`, scoped to the API's own
  domain and to path `/api/v1/auth/`). This cookie is invisible to both client JS *and* this app's own
  Next.js server — `middleware.ts` can't read it. Route protection now uses a small first-party
  "session hint" cookie (`sm_session`, no auth value of its own) set after a successful login/refresh —
  see the comments in `lib/auth.ts` and `middleware.ts` for the full reasoning. Real authorization is
  still enforced entirely by the API's 401 responses.
- **Cursor pagination is opaque-URL-based** (`next`/`previous` full URLs), not a `cursor` query param
  you construct — `ListingsQuery.cursorUrl` is fetched as-is when following a page link.
- **IDs are numeric on the wire**, kept as strings in the app (Next route params are strings anyway) and
  converted with `Number()` only where the API needs a numeric value in a request body.
- **Listing condition is `new | good | fair | worn`** — no `like_new` (dropped from `Badge.tsx` and the
  create/edit forms).
- **Public user shape has no `avatarUrl`, `phone`, or location** — only `id`, `username`, `role`,
  `isVerified`, `dateJoined`. Listing owner avatars now render initials-only; a real photo would need a
  new endpoint.
- **Grade level is free text**, not an enum — filters and forms use a plain text input instead of a select.
- **Categories are dynamic**, fetched from `GET /categories/` rather than hardcoded, in both the listings
  filter sidebar and the create/edit-listing forms.
- **Photo upload is a separate step**: `POST /listings/{id}/photos/` (multipart), called after listing
  creation, not part of the create payload. The create-listing flow now creates the listing first, then
  uploads the compressed photo, with a friendly fallback message if the upload step fails.
- **`BookRequest` has no `donor` field.** Per `API_REFERENCE.md`'s guidance, incoming vs. sent requests
  are now split client-side by comparing `requester.id` to the current user's id.
- **Accepting a request doesn't return the new exchange's id.** Added a new `/exchanges` list page (not
  in the original scope) so users have somewhere to land and find the exchange to schedule.
- **Exchange scheduling requires a real `scheduled_at` datetime** — the earlier "flexible" checkbox concept
  doesn't exist in the real API; replaced with a `datetime-local` input, and `dropoff_point` is optional.
- **Rating is a real endpoint** (`POST /exchanges/{id}/rate/`) — wired up for real (previously a toast-only
  placeholder), including friendly handling of `duplicate_rating`.
- **Reporting is a real, wired-up modal** (`components/listings/ReportModal.tsx`), including friendly
  handling of `duplicate_report`.
- **`404` vs `403` and `invalid_transition` handling**: accept/decline/complete/cancel/rate mutations now
  show a friendly "already handled" message on `invalid_transition` instead of a raw error, per the API
  docs' guidance on races between tabs/devices.
- Impact-stats fields, error-response shape (`detail`/`code`/`errors`), and the health-check's separate
  base path (`/api/health/`, not under `/api/v1/`) are all reflected in `lib/api-client.ts`.

## Gallery section (this pass)

- **`components/listings/ListingGallery.tsx`**: the listing detail page now shows a real gallery instead
  of just the first photo — a main image plus a thumbnail strip (only rendered when there's more than
  one photo) that switches the main image on click, with `role="tablist"`/`role="tab"` for accessibility.
  This was actually part of the original spec ("Image gallery with lazy-loaded, responsive `next/image`")
  that hadn't been implemented, since the earlier single-photo upload flow meant there was rarely more
  than one image to show.
- **`components/listings/PhotoPicker.tsx`**: a new shared multi-photo picker (add/remove, live previews,
  compression on select, capped at 6 photos) used by both the create-listing form (step 2 is now "add
  photos", plural) and the edit-listing form (a new read-only gallery of existing photos plus this picker
  to add more). Photos are still uploaded one-at-a-time to `POST /listings/{id}/photos/` after creation
  (or immediately on edit), since that's the only upload endpoint the API exposes.
- There's still no endpoint to delete or reorder an individual photo once uploaded (confirmed in
  `API_REFERENCE.md`) — existing photos in the edit form are shown read-only for now.

## Impact/activities Gallery page (this pass)

Added a new public **`/gallery`** page for SalvageMe to post photos of donation drives, drop-off days,
and other community activities — distinct from the per-listing photo gallery added in the previous pass.

- **`app/(public)/gallery/page.tsx`**: static page, responsive photo grid, real empty state if there's
  nothing to show yet.
- **`components/gallery/GalleryGrid.tsx`**: grid of thumbnails that opens a full-screen, keyboard-navigable
  lightbox (arrow keys / Escape, `role="dialog"`) with captions and optional dates.
- **`lib/content/gallery.ts`**: there's no backend endpoint for this kind of media content
  (`API_REFERENCE.md` covers listings/exchanges/stats, not a photo library), so — same pattern as the FAQ
  page — it's editable config rather than hardcoded JSX. **To add a real photo**: drop the file in
  `public/gallery/` and add an entry to this file. No redeploy-the-whole-component needed, just a data
  edit, but it does still require a code change and redeploy (see follow-ups for the real fix).
- Ships with **three placeholder illustrations** (`public/gallery/sample-*.jpg`, generated flat-color book
  glyphs in the site's own palette) so the page isn't empty by default and the grid/lightbox are visibly
  exercised — each is captioned "Sample entry" so it's unambiguous these aren't real event photos.
  Swap or delete them once real photos are available.
- Added to both the header nav and footer.

## Verified in this pass

- `npm run typecheck`, `npm run lint`, and `npm run build` all pass clean against the real API's types.
- `npm test` — 3/3 Vitest unit tests pass.
- Ran the built app locally against the **mock adapter** (`NEXT_PUBLIC_API_MODE=mock`) and confirmed:
  homepage renders impact stats, `/listings` renders SSR listing cards, `/listings/[id]` emits correct
  `og:title` metadata, and `/dashboard` correctly redirects to `/login` when signed out.
- **Could not runtime-test against the actual live backend** in this environment — the sandbox this was
  built in only allows network egress to package registries (npm, GitHub, PyPI, etc.), not to
  `salvageme.pythonanywhere.com`. `npm run build` initially failed for exactly this reason (the homepage's
  build-time impact-stats fetch got a proxy-level block, not a real API response); fixed by making that
  fetch resilient (falls back to hiding the stats section rather than failing the page/build) — but this
  also means the actual request/response shapes against the live backend are unverified beyond matching
  `API_REFERENCE.md` by hand. **Please smoke-test against the real deployed backend before shipping.**

## UX fixes (this pass)

- **Loading states**: added `loading.tsx` files for the `(public)`, `(app)`, and `(auth)` route groups
  (Next.js applies special files placed directly in a route group to every route nested under it), plus
  more specific ones for `/listings` and `/listings/[id]`, all built from the existing `Skeleton` /
  `ListingCardSkeleton` primitives so the app never shows a blank white screen while a page's data loads.
- **Image preview on the create-listing form**: selecting a photo now shows a thumbnail (via a blob
  `object-cover` preview, revoked on change/unmount to avoid leaking memory) with a remove button, instead
  of just a bare file input with no feedback.
- **Manual location entry**: the location step now offers "Use my current location" (unchanged) or "Enter
  a different location", the latter exposing raw latitude/longitude number inputs with range validation
  (-90..90 / -180..180). No geocoding is available (the API only accepts coordinates, and no geocoding
  key was specified), so this is coordinates-only for now — see follow-ups.
- **Logo**: replaced the placeholder `lucide-react` icon in the header with the real SalvageMe logo
  (`public/logo.jpg`), and generated `app/icon.png` from it so Next.js picks it up as the site favicon
  automatically.

## Follow-ups (prioritized, not silently dropped)

1. **Runtime-verify against the live backend** (see above) — register a real user, create a real listing
   with a real photo upload, and walk the full request → accept → schedule → complete → rate flow.
2. **`next/image` remote patterns** in `next.config.mjs` are wildcarded (`hostname: "**"`) because the
   real FileForge CDN hostname isn't given in `API_REFERENCE.md` (only a placeholder `cdn.example`) —
   tighten this to the actual CDN host once known.
3. **Wire `next/font`** for the display/body typefaces referenced in `tailwind.config.ts` — still only
   font-family tokens, not actual font loading.
4. **No self-serve verification-request flow** — Settings just displays verification status; requesting
   verification happens outside the API (Django Admin), so there's nothing to build against yet.
5. **Manual location entry has no reverse geocoding** — it's raw latitude/longitude number inputs, since
   the API only accepts coordinates and no geocoding endpoint or key was specified. An address-to-coordinates
   lookup (e.g. via a geocoding API) would be a nicer input than asking people to know their own lat/lng.
6. **Full Playwright critical-path test is still skipped**, pending a way to seed a second test user and
   reset backend/mock state between runs without cross-test bleed — and now also needs deciding whether
   E2E should run against the mock adapter or a real staging backend.
7. **i18n**: structure still avoids hardcoding strings in a way that would block `next-intl`, but no
   translation layer has been set up.
8. **`GET /api/health/` isn't surfaced in the UI** — `apiClient.getHealth()` exists but nothing calls it
   yet; could back an uptime banner.
9. **Loading UI is route-group-level, not per-page** — `loading.tsx` files at `(public)/`, `(app)/`, and
   `(auth)/` cover the gap during initial navigation/data fetch, with more specific ones for `/listings`
   and `/listings/[id]`. Pages under `(app)/` still show their own inline skeleton/spinner once their
   client JS takes over (since TanStack Query loading states aren't visible to `loading.tsx`); giving
   every route its own tailored `loading.tsx` instead of sharing the group-level one is a nice-to-have.
10. **Logo may not be transparent** — depending on the source file, it could show a white box on any
    non-white background. Confirm/ask for a transparent version if the logo needs to sit on a colored
    surface later.
11. **The impact/activities Gallery has no backend or self-serve upload** — it's a code-level config file
    (`lib/content/gallery.ts`) plus static files in `public/gallery/`, so adding a real photo currently
    requires a code change and redeploy, not something SalvageMe's team can do without a developer. If
    photos will be added often, this deserves a real endpoint (e.g. `POST /gallery/` behind admin auth,
    backed by FileForge like listing photos) with the frontend swapped to fetch from it instead.
