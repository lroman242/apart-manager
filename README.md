# Apart Manager

A web application for managing utility payments across multiple apartments. Track monthly meter readings, calculate resource consumption, and maintain a full payment history per apartment.

## Features

- Manage multiple apartments
- Configure tariffs (services and metered resources)
- Record utility payments with line items per tariff
- Track meter readings and auto-calculate consumption between periods
- Edit the most recent payment if corrections are needed

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth
- **Deploy**: Docker + nginx (production), Vite dev server (development)

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (could be used via Docker container)

### Setup

```bash
# Copy environment variables
make env_local   # for local dev
make env_prod    # for production

# Fill in your Supabase URL and anon key in the generated file
```

### Development

```bash
make run_dev
```

App will be available at [http://localhost:5173](http://localhost:5173).

### Production

```bash
make run_prod
```

App will be available at [http://localhost](http://localhost).

## Database

```bash
make migrate              # push all pending migrations to Supabase
make migration name=foo   # create a new migration file
make db_reset             # reset local DB and rerun all migrations
make db_pull              # pull remote schema into local migrations
make db_diff name=foo     # generate migration from local schema changes
make status               # show local Supabase service status
```

## Edge Functions

```bash
make deploy               # deploy all edge functions
make function name=foo    # scaffold a new edge function
make logs name=foo        # tail logs for a function
```

## Linting

```bash
make lint
```
