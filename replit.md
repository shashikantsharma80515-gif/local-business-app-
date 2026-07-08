# MediMarket — Multi-Vendor Medical Marketplace

A production-ready medical marketplace platform connecting patients with verified medical stores and registered delivery partners.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/medical-marketplace run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)
- Required env: `SESSION_SECRET` — used as JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui (wouter routing)
- API: Express 5 with JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle for API server)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, stores, orders, delivery_profiles)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, dashboard, stores, orders)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware + role guards
- `artifacts/medical-marketplace/src/pages/` — React pages (Landing, Login, Register, Dashboards)
- `artifacts/medical-marketplace/src/lib/auth.ts` — localStorage token helpers
- `artifacts/medical-marketplace/src/hooks/use-auth.ts` — useAuth() hook
- `lib/api-client-react/src/custom-fetch.ts` — setAuthTokenGetter for JWT injection

## Architecture decisions

- JWT stored in localStorage (Bearer token), injected into all API calls via `setAuthTokenGetter` in main.tsx
- Passwords hashed with bcryptjs (12 rounds) — never stored in plaintext
- SESSION_SECRET (Replit secret) used for JWT signing — never hardcoded
- Admin accounts cannot be self-registered — must be seeded or bootstrapped securely
- Phone OTP is a demo placeholder (code: 123456) — wire to Twilio/Firebase for production
- Google OAuth is a visual placeholder — wire to Google OAuth 2.0 credentials for production
- Role-based access: every protected route checks JWT role claim

## Product

- **Customer**: Browse stores, track orders, view delivery status
- **Store Owner**: Manage store profile, confirm orders, track revenue
- **Delivery Partner**: Accept pickups, update delivery status, track earnings
- **Admin**: System-wide stats, user management (activate/deactivate), verification control

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Demo Accounts (password: `password123` for all)

| Email | Role |
|---|---|
| admin@medimarket.com | Admin |
| customer@medimarket.com | Customer |
| store@medimarket.com | Store Owner |
| delivery@medimarket.com | Delivery Partner |

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend
- The `setAuthTokenGetter` call in `main.tsx` is critical — without it, all protected API calls return 401
- Drizzle `numeric` columns come back as strings from PostgreSQL — always call `parseFloat()` when using them
- Health endpoint is at `/api/healthz` (double-check: health.ts registers `/`, mounted at `/healthz` in router)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
