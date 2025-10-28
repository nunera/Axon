# Axon - Collaborative Task Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Axon is a collaborative task management platform designed to help teams organize work, match skills to tasks, and track project progress. Built with SvelteKit, Drizzle ORM, and modern web technologies, Axon creates an intuitive working environment for organizations of all sizes.

## Features

- **User Authentication**: Secure login and registration backed by Better Auth
- **Organization Management**: Create and manage multiple organizations
- **Task Management**: Create, assign, and track tasks with priorities and deadlines
- **Skill Matching**: AI-powered skill extraction and matching between users and tasks
- **Profile Management**: Manage user profiles with skills and interests
- **Interactive Visualizations**: Visual representation of skills and team connections
- **Modern UI**: Responsive design with a dark-mode interface
- **Dashboard**: Comprehensive overview of tasks, organizations, and activities

## Technology Stack

- **Frontend**: SvelteKit, TailwindCSS
- **Backend**: Node.js, SvelteKit server routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Styling**: TailwindCSS
- **Containerization**: Docker & Docker Compose
- **Development**: TypeScript, Vite, ESLint

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (with the Compose plugin)
- PostgreSQL database

### Installation

1. Clone the repository:

   ```bash
   git clone https://gitlab.com/nunera/axon.git
   cd axon
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example file and adjust the values as needed:

   ```
   cp .env.example .env
   ```

   Ensure `DATABASE_URL` points to your local Postgres instance. Generate a `BETTER_AUTH_SECRET` (32+ character random string) and add it to `.env`. When deploying, set `BETTER_AUTH_URL` to the public origin (omit locally to use `http://localhost:5173`).

4. Start the database with Docker Compose:

```bash
docker compose up -d
```

To stop the stack and remove volumes:

```bash
docker compose down -v
```

5. Run database migrations:

   ```bash
   npm run db:push
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

### Google OAuth

Axon can authenticate with Google in addition to the username/password flow. Follow these steps to enable it for a local or deployed environment.

1. **Create / select a Google Cloud project**
   - Visit the [Google Cloud Console](https://console.cloud.google.com/) and choose the project you want to use (or create a new one).
   - Make sure the **OAuth consent screen** is configured (External is fine for testing). Add `profile` and `email` scopes when prompted and list your test user emails if the app is still in testing.

2. **Create an OAuth 2.0 Client**
   - Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Choose **Web application** as the application type.
   - Under **Authorized redirect URIs**, add the callbacks your environment will use:
     - Local development: `http://localhost:5173/api/auth/callback/google`
     - Production: `https://<your-domain>/api/auth/callback/google`
   - Save the client; Google will show you a **Client ID** and **Client Secret**.

3. **Update environment variables**
   - Add the credentials to `.env` (or your deployment secrets):

     ```env
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     ```

   - Make sure `BETTER_AUTH_URL` reflects the origin that Google redirects back to (e.g. `http://localhost:5173` for dev or your production URL).

4. **Restart the server**
   - Restart `npm run dev` (or redeploy) so the new env vars are picked up.
   - The login page will show a **“Continue with Google”** button only when both Google env variables are present.

5. **Verify the flow**
   - Click the Google button, continue through the Google consent screen, and ensure you land on `/dashboard` logged in.
   - Google returns users with the verified email address, so they can sign in again without re-registering.

If you add more social providers later, mirror the pattern used for Google in `src/lib/server/auth.ts`.

### Running with Docker

To run the entire application with Docker:

```bash
docker compose up -d
```

## Project Structure

- `/src` - Source code
  - `/lib` - Shared libraries and utilities
    - `/ai` - AI functionality like skill extraction
    - `/components` - Reusable UI components
    - `/server` - Server-side code including auth and database
  - `/routes` - SvelteKit routes and pages
- `/drizzle` - Database migrations and schema
- `/static` - Static assets

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

### Database Management

Use the provided npm scripts when working with the schema:

```bash
# Apply the latest migrations (run manually whenever the schema changes)
npm run db:push

# Open Drizzle Studio to inspect tables and data
npm run db:studio
```

#### Generating new migrations

The repository now tracks a single baseline migration (`drizzle/0000_*.sql`).
When you modify tables in `src/lib/server/db/schema.ts`, generate a new
incremental migration rather than editing the baseline:

```bash
npx dotenv -e .env -- drizzle-kit generate --name add_task_labels
npm run db:push
```

Commit the generated SQL file in `drizzle/` and the corresponding snapshot in
`drizzle/meta/` along with the code that depends on it.

## Contributing

Before starting, read the contributor guide in [`AGENTS.md`](AGENTS.md) for repo-specific workflow and quality expectations.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [SvelteKit](https://kit.svelte.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
- [TailwindCSS](https://tailwindcss.com/)
