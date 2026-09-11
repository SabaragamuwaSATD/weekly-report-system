# Weekly Report Generator & Team Dashboard

Full-stack internal tool for submitting, reviewing and analysing weekly team reports.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** NestJS 11, TypeScript
- **Database:** MongoDB (Mongoose)

## Project Structure

apps/
├─ web/ Next.js frontend
└─ api/ NestJS backend

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the database

Copy `apps/api/.env.example` to `apps/api/.env` and set `MONGODB_URI`
to your MongoDB connection string.

Copy the frontend env file:

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Run both apps

```bash
pnpm dev
```

- Frontend → http://localhost:3000
- Backend → http://localhost:4000/api
