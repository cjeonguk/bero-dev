# AGENTS.md

## Repo Shape
- Single-package React Router 7 app; not a monorepo.
- App code lives under `app/`.
- Route wiring is centralized in `app/routes.ts`; do not assume file-system auto-routing.
- SSR is enabled in `react-router.config.ts`.

## Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Production build: `npm run build`
- Serve built app: `npm run start`
- There is no `npm run lint` script. For a manual lint pass, use `npx eslint app --ext .ts,.tsx`.
- There is no test runner configured in `package.json`.

## Verification
- Preferred verification for most app changes: `npm run typecheck` then `npm run build`.
- `npm run typecheck` runs `react-router typegen && tsc`, so route types are generated as part of verification.
- Pre-commit runs `npx lint-staged` only on staged `app/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}` files, applying `eslint --fix` and `prettier --write`.

## Routing And App Structure
- Root HTML shell is `app/root.tsx`.
- Shared layout wrapper is `app/layouts/main.tsx`.
- Generated React Router types live under `.react-router/types`, and `tsconfig.json` includes that directory.
- Path alias `~/*` maps to `app/*`.

## Supabase
- Browser Supabase client: `app/lib/supabase/client.ts`.
- Server-side loaders/actions use `app/lib/supabase/server.ts`.
- When auth changes cookies on the server, return the `headers` from `createClient(request)` or session changes will not propagate correctly.
- Env vars used by both browser and server code: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY`.
- Database TypeScript types are in `app/types/database.types.ts`.

## MCP And Skills
- `opencode.json` configures MCP for `shadcn` and local Supabase.
- Use `shadcn` MCP to inspect/add components and examples instead of guessing registry commands.
- Use Supabase MCP for schema inspection, SQL execution, type generation, docs lookup, and advisors when working on auth/database issues.
- If the Supabase MCP server is unavailable, first check that the local Supabase stack is running on the configured ports.
- Repo-local OpenCode skills live in `.agents/skills/`.
- Load `react-router-framework-mode` before changing route wiring, loaders/actions, or framework-mode behavior.
- Load `supabase` for any auth, database, migrations, RLS, or Supabase client/server work.
- Load `shadcn` when adding or fixing shadcn/ui components.

## UI And Styling
- Shadcn is configured in `components.json`.
- The active shadcn style preset is `radix-nova`.
- Tailwind CSS entrypoint is `app/app.css`.

## Local Infra And Gotchas
- Supabase local config is `supabase/config.toml`.
- Local Supabase ports: API `54321`, DB `54322`, Studio `54323`, Inbucket `54324`.
- `supabase/config.toml` references `supabase/seed.sql`, but that file is currently absent; do not assume seeded local data exists.
- There is no repo CI workflow under `.github/workflows/`; do not assume CI will catch issues that local verification misses.
