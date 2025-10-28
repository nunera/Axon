# Repository Guidelines

## 1. Overview
Axon is a SvelteKit 5 dashboard for multi-member organizations with task visualizations and invite workflows. Server code leans on Drizzle ORM with a Postgres database that runs in Docker. Authentication now runs on Better Auth, so session management happens via `src/lib/server/auth.ts` and SvelteKit hooks.

## 2. Environment Setup
1. Duplicate `.env.example` to `.env` and adjust `DATABASE_URL` if you are not on localhost.
2. Generate a strong `BETTER_AUTH_SECRET` (32+ random characters) and add it to `.env`. Set `BETTER_AUTH_URL` to the deployed origin; omit locally to fall back to `http://localhost:5173`.
3. Install dependencies: `npm install` (pulls Better Auth runtime deps).
4. Start Postgres with `docker compose up -d`; stop it via `docker compose down -v` when you want a clean slate. The container automatically enables `pgcrypto` so session tokens generate correctly.
5. Apply schema changes with `npm run db:push` after every migration; this repository expects teammates to run it manually.
6. Launch the app using `npm run dev` (http://localhost:5173).

## 3. Authentication
- Better Auth lives in `src/lib/server/auth.ts` with the Drizzle adapter (provider set to `pg` for CLI compatibility) and username plugin. The SvelteKit handler owns the `/api/auth/**` endpoints and cookie wiring.
- `hooks.server.ts` sequences the Better Auth handler and a custom `validateRequest` helper that hits `/api/auth/get-session`, wiring `event.locals.user`/`session` for every request.
- Login, registration, and logout actions use `event.fetch` to hit Better Auth endpoints (`/api/auth/sign-in/username`, `/api/auth/sign-up/email`, `/api/auth/sign-out`). Keep validation server-side, but let Better Auth create sessions/cookies; plan for 500s when the auth API cannot reach Postgres.
- Google OAuth is optional. Provide `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env` and add `https://<host>/api/auth/callback/google` as an authorized redirect in Google Cloud. When configured, the login page exposes a “Continue with Google” action that posts to `/api/auth/sign-in/oauth2`.
- For production, set `BETTER_AUTH_URL` to the public origin so the generated redirect URIs match Google’s callback; the local default (`http://localhost:5173`) is fine for dev.

## 4. Project Layout
- `src/routes/**` – Feature routes (`+page.svelte`/`+page.server.ts`). Organization dashboards and modals live under `src/routes/dashboard`.
- `src/lib` – Shared UI, network helpers, and server utilities. Authentication helpers and DB client sit in `src/lib/server`.
- `drizzle/` – SQL migrations. The repo tracks a single baseline (`0000_*.sql`) plus incremental files. Always commit the generated SQL and updated `_journal.json`.
- `static/` – Uploaded assets. Clean up unused binaries manually.

## 5. Database & Migrations
- Key tables: `user`, `session`, `account`, `verification`, `organization`, `task`, `task_assignment`, `organization_invitation`, and skills/interests junctions.
- After editing schema files (`src/lib/server/db/schema*.ts`), run `npx dotenv -e .env -- drizzle-kit generate --name <change>` to create a new migration. Commit the SQL and matching snapshot(s), then remind reviewers to execute `npm run db:push` so Better Auth stays in sync.

## 6. NPM Scripts
- `npm run dev`, `npm run build`, `npm run preview` – Standard SvelteKit lifecycle.
- `npm run check` / `npm run check:watch` – TypeScript + Svelte diagnostics.
- `npm run lint` / `npm run format` – ESLint and Prettier (tailwind plugin enabled).
- `npm run db:start`, `npm run db:push`, `npm run db:migrate`, `npm run db:studio` – Drizzle helpers; prefer the explicit `docker compose` commands when you need flags.

## 7. UI & Interaction Patterns
- All creation/edit modals use a full-screen overlay, close on ESC/background click, and keep a sticky footer for action buttons.
- Task board cards remain draggable while still opening the edit prompt on click; ensure multiselect assignees stay in sync with the graph visualization.
- Profile dropdown has intentional hover gap—set pointer events so the menu stays active while the cursor crosses it.

## 8. Testing & Quality Gates
- Run `npm run check` plus `npm run lint` before committing.
- Vitest/Playwright are available but not wired; colocate `*.test.ts` with the feature if you add coverage and document manual smoke steps in PRs.

## 9. Contribution Workflow
1. Branch naming: `feature/*`, `fix/*`, etc.
2. Stage related DB migrations with the code that relies on them; mention the new file in your PR checklist.
3. Use short imperative commits (`Add invite accept flow`). Reference issues with `Closes #id` where relevant.
4. PRs should outline problem, solution, manual QA (include screenshots/gifs for UI), and note database steps testers must run.

## 10. Troubleshooting
- If auth feels stale, clear cookies and rerun `npm run db:push` to reset session rows.
- Stuck containers? `docker compose down -v` wipes everything; follow with `docker compose up -v` and new seed data.
- Drizzle migration errors like `column "id" is in a primary key` mean the table already exists—drop local tables or reset volumes before re-running.
