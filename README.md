# TaskFlow

A full-stack task assignment application where tasks are matched to developers by skill, and Google Gemini automatically infers required skills from task titles when none are specified.
This project is 100% created by agents.

---

## 1. Overview

TaskFlow allows teams to create tasks with required skills, manage a roster of developers with their associated skills, and assign tasks to developers who meet the skill requirements. A recursive subtask model supports up to 4 levels of task nesting. The Gemini LLM integration auto-classifies skill requirements from task titles, reducing manual tagging overhead.

---

## 2. Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Node.js 20, Express 4, TypeScript 5, Prisma 5 ORM |
| Frontend | React 18, TypeScript, Vite 8, Tailwind CSS v4, React Router, Axios |
| Database | PostgreSQL 15 |
| AI | Google Gemini Flash Latest (`gemini-flash-latest`) via `@google/generative-ai` |
| Infrastructure | Docker, docker-compose, nginx |

---

## 3. Architecture Diagram

```
Browser
  └─► nginx :80
        ├─► /          → SPA (index.html)
        └─► /api/*     → backend:3000
                            └─► PostgreSQL :5432
```

nginx serves the compiled React SPA for all non-API routes (enabling client-side routing) and reverse-proxies `/api/*` requests to the Express backend. The backend communicates with PostgreSQL via Prisma.

---

## 4. Database Schema

Five models with the following structure:

**Skill**
| Column | Type | Notes |
|---|---|---|
| id | Int | Primary key |
| name | String | Unique |

**Developer**
| Column | Type | Notes |
|---|---|---|
| id | Int | Primary key |
| name | String | |

**DeveloperSkill**
| Column | Type | Notes |
|---|---|---|
| developerId | Int | Composite PK, FK → Developer |
| skillId | Int | Composite PK, FK → Skill |

**Task**
| Column | Type | Notes |
|---|---|---|
| id | Int | Primary key |
| title | String | |
| status | String | Default: `"To-do"` |
| assignedDeveloperId | Int? | FK → Developer, nullable |
| parentTaskId | Int? | FK → Task (self-reference), nullable |
| createdAt | DateTime | |

**TaskSkill**
| Column | Type | Notes |
|---|---|---|
| taskId | Int | Composite PK, FK → Task |
| skillId | Int | Composite PK, FK → Skill |

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/skills` | List all skills |
| GET | `/api/skills/:id` | Get skill by ID |
| GET | `/api/developers` | List developers (supports `?skillIds=1,2` filter) |
| GET | `/api/developers/:id` | Get developer by ID |
| GET | `/api/tasks` | List root tasks with full 4-level nested subtree |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task (recursive subtasks, Gemini skill detection) |
| PATCH | `/api/tasks/:id` | Update assignee or status (business rules enforced) |

---

## 6. Business Rules

1. A task can only be assigned to a developer who has **all** required skills.
2. A task can only be marked **Done** if all direct subtasks are already Done.
3. If `skillIds` is omitted on creation, Gemini auto-identifies skills from the task title (recursively for subtasks); if Gemini is unavailable, skill identification fails silently and the task is created with no required skills.

---

## 7. Prerequisites

**To run with Docker (recommended):**
- Docker 24+
- docker-compose

**For local development (without Docker):**
- Node.js 20
- PostgreSQL 15 running locally

---

## 8. Configuration

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Open `.env` and set:

```
GEMINI_API_KEY=your_key_here
```

A free-tier API key is available from [Google AI Studio](https://aistudio.google.com/app/apikey). The application functions without a valid key — skill auto-detection is simply skipped.

> **Gemini free-tier quota:** The free tier allows **20 requests per day** for `gemini-flash-latest`. If this daily quota is exhausted, skill auto-detection will be unavailable until the quota resets (midnight Pacific time). When quota is exceeded, the app will still create the task successfully and display a warning popup prompting you to select skills manually. To avoid hitting the limit, select skills explicitly in the task form whenever possible.

---

## 9. How to Run (Docker)

```bash
cp .env.example .env   # add your GEMINI_API_KEY
docker-compose build --no-cache
docker-compose up
```

Once running:
- App: http://localhost
- API: http://localhost/api/tasks

The backend container automatically runs `prisma migrate deploy` and seeds the database on startup. Seeding is idempotent and safe to run repeatedly.

---

## 10. How to Stop

```bash
docker-compose down
```

To also remove the database volume (deletes all data):

```bash
docker-compose down -v
```

---

## 11. Development Setup (without Docker)

Requires Node.js 20 and PostgreSQL 15 running locally.

**Backend**

```bash
cd backend
npm install
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskflow" npx prisma migrate dev
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskflow" npx ts-node prisma/seed.ts
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskflow" npm run dev   # port 3000
```

**Frontend (new terminal)**

```bash
cd frontend
npm install
npm run dev   # port 5173, proxies /api to localhost:3000
```

The Vite dev server proxies all `/api` requests to `localhost:3000`, so no CORS configuration is required during local development.

---

## 12. Library Justification

**Express**
Minimal, widely-adopted Node.js framework; ideal for small REST APIs without the overhead of a larger framework. Its middleware model keeps route handlers composable and readable.

**Prisma 5**
Type-safe ORM with an auto-generated client, excellent TypeScript integration, and a straightforward migration workflow. v5 was chosen over v7 to avoid known datasource syntax regressions introduced in v7 that break the `url = env(...)` pattern and the `prisma-client-js` generator.

**React + Vite**
Vite's fast HMR and native ESM bundling dramatically improves developer experience over Create React App. React's component model is a natural fit for the recursive task tree UI, where a single `TaskFormNode` component renders itself for each subtask level.

**Tailwind CSS**
The utility-first approach enables rapid, consistent dark-theme styling without maintaining a separate CSS file. Co-locating styles with markup also reduces context-switching during UI iteration.

**Axios**
Cleaner than the native `fetch` API for typed API calls; supports response unwrapping and interceptors, which keeps the API client layer (`src/api/`) concise.

**@google/generative-ai**
The official Gemini SDK provides straightforward model instantiation and text generation with minimal boilerplate. The fail-silent wrapper around `identifySkills` ensures an unavailable or rate-limited Gemini API never blocks task creation.

**docker-compose**
Single-command orchestration for the three-service stack (PostgreSQL, backend, nginx/frontend). Service dependency healthchecks ensure the database is accepting connections before the backend attempts to run migrations.
