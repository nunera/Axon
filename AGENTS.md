# Repository Guidelines

## 1. Overview

Axon is a SvelteKit 5 application with a Postgres backend managed through Drizzle ORM. The project supports multi-member organizations, task management with skill tagging, and invite/accept workflows. The UI is pure Svelte (no Storybook) and strives for accessible modals and keyboard navigation. All server mutations rely on SvelteKit form actions with `use:enhance` to keep navigation and state in sync.

## 2. Repository Layout

- `src/routes` – Route-driven features using `+page.svelte`, `+page.ts`, and `+page.server.ts`. Dashboard features live under `src/routes/dashboard/**`.
- `src/lib` – Shared UI (e.g., `src/lib/components/`), server utilities (`src/lib/server/**`), and styling helpers. Global CSS is in `src/app.css`.
- `drizzle/` – SQL migrations and metadata; `drizzle.config.ts` points at `src/lib/server/db/schema.ts`.
- `docker-compose.yml` – Single Postgres service used in local development.
- `README.md` / `AGENTS.md` – Primary onboarding docs. Keep these aligned with code.

## 3. Environment & Services

1. Copy `.env.example` → `.env` and adjust `DATABASE_URL` if necessary.
2. Install dependencies with `npm install`.
3. Start Postgres locally: `docker compose up -v` (stop with `docker compose down -d`).
4. Apply schema changes: run `npm run db:push` (always executed manually in this repository).
5. Launch the dev server: `npm run dev` (http://localhost:5173).

## 4. NPM Scripts

- `npm run dev` – Vite dev server with hot reload.
- `npm run build` / `npm run preview` – Production build & smoke test.
- `npm run check` / `npm run check:watch` – TypeScript + Svelte diagnostics.
- `npm run lint` & `npm run format` – ESLint + Prettier workflows.
- `npm run db:start` – Convenience wrapper (uses `docker compose up`). Prefer the manual command for adding flags.
- `npm run db:push`, `npm run db:migrate`, `npm run db:studio` – Drizzle operations. `db:push` syncs schema; `db:migrate` runs generated SQL migrations; `db:studio` opens the GUI.

## 5. Database Schema Highlights

- `task_assignment` joins tasks to multiple users; keep `assignedToId` in `task` synced with the first assignee for backwards compatibility.
- `organization_invitation` captures pending invites (`status` is `pending|accepted|declined`). Creation uses `inviteMember` action; acceptance/decline handled on `src/routes/dashboard/organizations/+page.server.ts`.
- `task_skill` links tasks to required skills; importance defaults to 3. Skill management lives in `src/lib/server/db/schema-extension.ts`.

When editing schema files, update migrations via `drizzle-kit` and ensure `npm run db:push` is run locally. Do not commit `.env` or generated SQL logs.

## 6. UI & Interaction Patterns

- All modals (create/edit task, invites, delete org, etc.) use full-screen overlays. They close via ESC or background click and maintain scrollable content with a sticky footer housing action buttons.
- Task board cards (in dashboard organization detail) are `<button>` elements for accessibility; they remain draggable while supporting click-to-edit.
- Forms rely on `use:enhance` to process server action results. For redirects, throw `redirect()` in the action so `enhance` handles navigation without manual refresh.
- Avoid reintroducing Storybook artifacts (`src/stories`, `.storybook`, npm scripts) – the component catalogue has been removed.

## 7. Testing & Quality Gates

- Run `npm run check` before committing; it syncs SvelteKit and runs `svelte-check`.
- Run `npm run lint` and `npm run format` to enforce Prettier + ESLint rules.
- Vitest/Playwright dependencies exist but suites are not yet wired. Create tests alongside features (`*.test.ts` near implementation) and add scripts if automated testing becomes a requirement.

## 8. Features & Business Rules

- Only organization owners (creator) can delete an org. Owners cannot leave the org; surface guidance instructing them to delete or transfer ownership instead.
- Invitations are a two-step process: admins send invites via `inviteMember`; invitees accept/decline from the dashboard landing page. The UI surfaces pending invites both globally and within organization membership lists.
- Tasks support multiple assignees and required skills. Keep the board, sphere visualization (`src/lib/components/SphereVisualization.svelte`), and server actions (`createTask`, `updateTask`) in sync when changing task structure.

## 9. Contribution Workflow

1. Create descriptive branches (`feature/*`, `fix/*`).
2. Run `npm run check` + `npm run lint` before committing.
3. For DB changes: update schema + migrations, run `npm run db:push`, and document manual steps in PRs.
4. Use short, imperative commit messages (e.g., `Add invite accept modal`). Reference issues with `Closes #123` when applicable.
5. PRs should summarize problem, solution, manual validation (screenshots for UI, steps for migrations), and note any follow-up work.

## 10. Handy References

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Vis Network](https://visjs.org/)
- Postgres container credentials defined in `docker-compose.yml` (user `root`, password `mysecretpassword`, db `local`).

Keep this file updated whenever workflows or tooling shift. Future agents rely on it for fast context.
