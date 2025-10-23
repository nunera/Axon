# Axon - Collaborative Task Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Axon is a collaborative task management platform designed to help teams organize work, match skills to tasks, and track project progress. Built with SvelteKit, Drizzle ORM, and modern web technologies, Axon creates an intuitive working environment for organizations of all sizes.

## Features

- **User Authentication**: Secure login and registration with Lucia auth
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
- **Authentication**: Lucia Auth
- **Styling**: TailwindCSS
- **Containerization**: Docker & Docker Compose
- **Development**: TypeScript, Vite, ESLint

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
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
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/axon"
   ```

4. Start the database with Docker:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   npx drizzle-kit push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

### Running with Docker

To run the entire application with Docker:

```bash
docker-compose up -d
```

## Project Structure

- `/src` - Source code
  - `/lib` - Shared libraries and utilities
    - `/ai` - AI functionality like skill extraction
    - `/components` - Reusable UI components
    - `/server` - Server-side code including auth and database
  - `/routes` - SvelteKit routes and pages
  - `/stories` - Storybook component stories
- `/drizzle` - Database migrations and schema
- `/static` - Static assets

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run storybook` - Start Storybook for component development

### Database Management

Use Drizzle ORM for database management:

```bash
# Generate new migrations
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit push
```

## Contributing

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
- [Lucia Auth](https://lucia-auth.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Storybook](https://storybook.js.org/)
