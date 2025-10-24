# Repository Guidelines

## Project Structure & Module Organization
Axon is a SvelteKit app. Feature routes live in `src/routes` using `+page` files with matching `.server.ts` handlers. Shared UI and utilities belong in `src/lib`, while demos and visual tests stay in `src/stories`. Global styles sit in `src/app.css`. Database schema and migrations live under `drizzle`, and static assets reside in `static`.

## Build, Test, and Development Commands
- `npm install` — install dependencies and sync SvelteKit metadata.
- `npm run dev` — hot-reload dev server at http://localhost:5173.
- `npm run build && npm run preview` — create a production bundle and smoke-test locally.
- `npm run check` — TypeScript and Svelte diagnostics; keep the report clean.
- `npm run lint` / `npm run format` — run ESLint and Prettier before commits.
- `npm run storybook` — launch Storybook; `npm run build-storybook` creates the static bundle.
- `npm run db:start` — start dockerized Postgres; `npm run db:migrate` applies Drizzle migrations.

## Coding Style & Naming Conventions
Follow Prettier defaults (2-space indent, single quotes in TS) and the ESLint config. Prefer named exports from `src/lib`. Route directories stay kebab-case, while modules use camelCase filenames. Name Svelte components in PascalCase and keep helpers pure at module scope.

## Testing Guidelines
Vitest powers unit tests; place `*.test.ts` beside the code they cover and run `npx vitest run --coverage`. Document UI behavior with Storybook entries in `src/stories` and add controls when practical. Playwright handles end-to-end checks via `npx playwright test` after building the app. Prioritize auth and dashboard smoke paths.

## Database & Environment
`docker-compose.yml` spins up local Postgres; stop it with `docker compose down`. Use `npm run db:push` for scratch work and `npm run db:migrate` for committed changes. Keep `.env` aligned with the Drizzle connection string and never commit secrets.

## Commit & Pull Request Guidelines
Write short, imperative commit subjects (e.g., `Add onboarding flow`) and group related changes. Reference issues with `Closes #id` in the body when relevant. PRs should state problem, solution, and manual verification; attach screenshots for UI work and link Storybook or Vitest output. Confirm `npm run lint`, `npm run check`, and tests pass before requesting review.
