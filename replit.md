# SalvageMe

A community book exchange platform connecting book donors with students and families in Ghana — free, peer-to-peer, no middlemen.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 20, TypeScript 5.9
- **Frontend**: React 18, Vite 7, Tailwind CSS v4 (`artifacts/salvageme/`)
- **Routing**: Wouter v3
- **State**: Zustand (auth, toasts)
- **Data fetching**: TanStack React Query v5
- **Backend**: External Django REST API at `https://salvageme.pythonanywhere.com/api/v1` (see `API_REFERENCE.md`)

## Running the app

```bash
pnpm install
pnpm run dev
```

The dev server starts at the port assigned by Replit (via `PORT` env var). The Vite config reads `PORT` and `BASE_PATH` automatically.

## Project structure

```
artifacts/salvageme/   # React + Vite frontend
lib/api-spec/          # API type definitions
lib/api-zod/           # Zod schemas
lib/db/                # Drizzle ORM schema (PostgreSQL, needs DATABASE_URL)
```

## Environment variables

- `DATABASE_URL` — required only if using `lib/db` (Drizzle schema push). Not needed to run the frontend.
- `PORT` / `BASE_PATH` — injected automatically by the Replit workflow system.

## Notes

- The backend at `salvageme.pythonanywhere.com` must have the Replit dev domain added to `CORS_ALLOWED_ORIGINS` for API calls to work in the preview pane.
- Firebase Hosting config (`firebase.json`) is pre-configured for production SPA deploys.

## User preferences

_None recorded yet._
