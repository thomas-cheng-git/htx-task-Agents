# TaskFlow — Project Context

## Overview

TaskFlow is a full-stack task assignment application built as an HTX technical assessment. Tasks are matched to developers by skill, and the Gemini LLM automatically infers required skills from task titles when none are specified.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Prisma 5 |
| Database | PostgreSQL 15 |
| AI | Google Gemini Flash (`gemini-flash-latest`) |
| Infrastructure | Docker, docker-compose, nginx |

## Repository Structure

```
htx/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # 5 models: Skill, Developer, DeveloperSkill, Task, TaskSkill
│   │   ├── seed.ts            # Idempotent seed (guards with developer.count check)
│   │   └── migrations/        # Prisma migration files
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.ts      # Singleton PrismaClient
│   │   │   └── gemini.ts      # Gemini skill identification (fail-silent)
│   │   ├── routes/
│   │   │   ├── skills.ts
│   │   │   ├── developers.ts  # Supports ?skillIds=1,2 filter
│   │   │   └── tasks.ts       # Full CRUD with recursive subtask support
│   │   └── index.ts           # Express app entry point (port 3000)
│   ├── Dockerfile
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client (baseURL: /api)
│   │   ├── components/        # NavBar, TaskFormNode (recursive)
│   │   ├── pages/             # TaskListPage, CreateTaskPage, DevelopersPage
│   │   └── types.ts           # TypeScript interfaces
│   ├── nginx.conf             # Serves SPA + proxies /api to backend
│   └── Dockerfile
├── docker-compose.yml
├── .env                       # GEMINI_API_KEY (not committed)
└── .env.example
```

## Key Architecture Decisions

- **Prisma 5** (not v7): v7 broke the `url = env(...)` datasource syntax and `prisma-client-js` generator
- **Recursive Prisma include**: `taskInclude` nests `childShape` 4 levels deep to support up to 4 subtask levels
- **Gemini fail-silent**: If LLM unavailable, skill identification returns `[]` and task creation proceeds
- **Idempotent seeding**: Seed script checks `developer.count()` before inserting — safe to run on every container start
- **nginx SPA routing**: `try_files $uri $uri/ /index.html` handles client-side routing

## Business Rules

1. A task can only be assigned to a developer who has **all** required skills
2. A task can only be marked **Done** if all direct subtasks are already Done
3. If `skillIds` omitted on creation, Gemini auto-classifies from the task title (recursively for subtasks)

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/skills` | List all skills |
| GET | `/api/developers` | List developers (supports `?skillIds=1,2` filter) |
| GET | `/api/tasks` | List root tasks with full nested subtree |
| POST | `/api/tasks` | Create task (recursive subtasks, LLM skill detection) |
| PATCH | `/api/tasks/:id` | Update assignee or status (enforces business rules) |

## Running Locally (Docker)

```bash
cp .env.example .env  # add GEMINI_API_KEY
docker-compose build --no-cache
docker-compose up
# open http://localhost
```

## Running Locally (without Docker)

```bash
# Backend (requires PostgreSQL 15, Node 20)
cd backend && npm install
npx prisma migrate dev && npx prisma db seed
npm run dev  # port 3000

# Frontend
cd frontend && npm install
npm run dev  # port 5173 (proxies /api to localhost:3000)
```
