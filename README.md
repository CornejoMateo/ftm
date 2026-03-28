# FTM - Football Team Manager

FTM is a football team management application built with Next.js and wrapped in Electron for desktop usage.

It includes player management, match tracking, reports, comparisons, and annual summaries.

## Features

- Player management (create, edit, delete)
- Match and per-player match statistics tracking
- Dashboard and reports views
- Player comparison tools
- Annual reports
- Responsive UI built with Tailwind CSS and shadcn/ui

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript
- UI: Tailwind CSS, shadcn/ui, Radix UI
- Charts: Recharts
- Desktop: Electron
- Database: PostgreSQL (via node-postgres)
- Spreadsheet import: xlsx

## Project Structure

```text
ftm/
├── src/                    # Next.js app
│   ├── app/                # App Router pages and routes
│   ├── components/         # Reusable React components
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom hooks
│   ├── lib/                # DB access, server actions, utilities
│   ├── styles/             # Global styles
│   └── package.json        # Next.js dependencies/scripts
├── electron-app/           # Electron wrapper
│   ├── main.cjs            # Electron main process
│   └── package.json
├── docker-compose.yml      # App + PostgreSQL local stack
├── Dockerfile              # Production image for Next.js app
└── package.json            # Root scripts
```

## Prerequisites

- Node.js 20+
- npm
- Docker (recommended for local PostgreSQL and app runtime)

## Installation

Install all dependencies from the repository root:

```bash
npm run install:all
```

Manual alternative:

```bash
npm install
cd src && npm install
cd ../electron-app && npm install
```

## Running the Project

### Option A: Docker Compose (recommended)

Starts PostgreSQL and the web app in containers.

```bash
docker compose up --build
```

App URL: http://localhost:3000

### Option B: Local Next.js + local PostgreSQL

1. Ensure PostgreSQL is running.
2. Set environment variables (see Environment Variables below).
3. Start the app:

```bash
npm run dev:next
```

App URL: http://localhost:3000

## Environment Variables

The app supports either a single connection string or discrete PostgreSQL settings.

### Preferred

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
```

### Alternative

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ftm
```

Notes:

- If DATABASE_URL is set, it is used first.
- If DATABASE_URL is not set, POSTGRES_PASSWORD and a valid numeric POSTGRES_PORT are required.

## Database

On startup, the app initializes required tables if they do not exist:

- players
- matches
- match_players

Initialization logic lives in src/lib/postgres.ts.

## Available Scripts

### Root scripts

- npm run install:all: Install root, Next.js, and Electron dependencies
- npm run dev:next: Start Next.js development server (from src)
- npm run dev:electron: Start Electron in development mode
- npm run dev: Alias for dev:next
- npm run build:next: Build the Next.js app
- npm run build:electron: Install Electron app dependencies
- npm run build: Run Next.js and Electron build steps
- npm start: Alias for dev:next
- npm run electron: Alias for dev:electron

### Next.js app scripts (in src/package.json)

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run export
- npm run format
- npm run format:check

## Docker Services

docker-compose.yml defines:

- postgres: PostgreSQL 17 on host port 5433
- app: Next.js app on port 3000

## License

This project is licensed under the ISC License. See [LICENSE](LICENSE).

## Author

Mateo Cornejo

- GitHub: https://github.com/CornejoMateo
