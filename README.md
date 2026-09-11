# Weekly Report Generator & Team Dashboard

Full-stack internal tool for submitting, reviewing and analysing weekly team reports.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Install dependencies](#1-install-dependencies)
  - [2. Configure environment variables](#2-configure-environment-variables)
  - [3. Run both apps](#3-run-both-apps)
- [Available Scripts](#available-scripts)

## Tech Stack

| Layer        | Technology                                |
| ------------ | ------------------------------------------ |
| Frontend     | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend      | NestJS 11, TypeScript                     |
| Database     | MongoDB (Mongoose)                        |
| Tooling      | pnpm workspaces, concurrently             |

## Project Structure

```
weekly-report-system/
├─ apps/
│  ├─ web/   # Next.js frontend
│  └─ api/   # NestJS backend
├─ package.json          # root scripts (dev, build)
└─ pnpm-workspace.yaml    # pnpm workspace definition
```

## Prerequisites

- [pnpm](https://pnpm.io/) (workspace-managed monorepo)
- A MongoDB instance (local or Atlas connection string)

## Setup

### 1. Install dependencies

Run from the repository root — pnpm installs dependencies for both `apps/web` and `apps/api`:

```bash
pnpm install
```

### 2. Configure environment variables

**Backend** — copy `apps/api/.env.example` to `apps/api/.env` and fill in the values:

| Variable      | Description                          | Example                                                                          |
| ------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| `PORT`        | Port the NestJS API listens on        | `4000`                                                                            |
| `WEB_ORIGIN`  | Allowed CORS origin for the frontend  | `http://localhost:3000`                                                          |
| `MONGODB_URI` | MongoDB connection string             | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/weekly_reports?retryWrites=true&w=majority` |

**Frontend** — create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Run both apps

```bash
pnpm dev
```

| App      | URL                            |
| -------- | ------------------------------- |
| Frontend | http://localhost:3000          |
| Backend  | http://localhost:4000/api      |

## Available Scripts

Run from the repository root:

| Script         | Description                                  |
| -------------- | --------------------------------------------- |
| `pnpm dev`     | Runs frontend and backend concurrently        |
| `pnpm dev:web` | Runs only the Next.js frontend (`apps/web`)   |
| `pnpm dev:api` | Runs only the NestJS backend in watch mode (`apps/api`) |
| `pnpm build`   | Builds both the frontend and backend for production |
