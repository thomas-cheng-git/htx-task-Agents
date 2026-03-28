# HTX Task Assignment App — Full Project Brief

## Overview
Build a full-stack Task Assignment web application as a technical assessment for HTX Singapore.

## Tech Stack
- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL 15
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
- AI: Google Gemini 1.5 Flash (free tier)
- Infrastructure: Docker, docker-compose, nginx
- Structure: Monorepo with /backend and /frontend folders

## Part 1 — Database Schema
Models:
- Skill: id, name (unique). Seed: Frontend, Backend
- Developer: id, name
- DeveloperSkill: junction table (developerId, skillId) — composite PK
- Task: id, title, status (default "To-do"), assignedDeveloperId (optional FK),
  parentTaskId (optional FK to self — enables unlimited subtask nesting), createdAt
- TaskSkill: junction table (taskId, skillId) — composite PK

Seed data:
- Alice → Frontend
- Bob → Backend
- Carol → Frontend + Backend
- Dave → Backend
- 3 sample tasks matching the wireframe in the spec

## Part 2 — Backend API
All routes under /api prefix. Use express.json() and cors() middleware.
Singleton PrismaClient in src/lib/prisma.ts.

GET  /health
GET  /api/skills
GET  /api/skills/:id
GET  /api/developers  (support ?skillIds=1,2 filter — returns devs with ALL specified skills, no duplicates)
GET  /api/developers/:id
GET  /api/tasks  (include skills, assignedDeveloper, children recursively 4 levels deep)
GET  /api/tasks/:id
POST /api/tasks  (accepts recursive subtasks array, Prisma transaction for atomicity)
PATCH /api/tasks/:id  (assignedDeveloperId: validate skill match; status "Done": validate all subtasks Done)

Business rules enforced with 400 errors:
- "Developer does not have the required skills for this task"
- "All subtasks must be Done before marking this task as Done"

## Part 3 — Frontend Pages
Dark theme throughout:
- Page bg: #0f1117, Card bg: #13151f, Border: #2d3148
- Text: #e2e8f0, Muted: #94a3b8, Accent: #6366f1
- Frontend badge: bg #1e3a5f text #60a5fa
- Backend badge: bg #1a3a2a text #4ade80

NavBar: app name "TaskFlow", links to Task List and Create Task, active link highlighted

Task List Page (/):
- Table: Task Title, Skills (coloured badges), Status (dropdown), Assignee (dropdown)
- Assignee dropdown filters to only developers with ALL task skills
- Subtasks shown indented below parent with left border accent
- Status/assignee changes call PATCH and refresh list
- Show inline error messages — no alert() calls

Task Create Page (/create):
- Recursive TaskFormNode component — title input + skill checkboxes + Add Subtask button
- useReducer for tree state management
- Save button POSTs full tree, navigates to / on success

## Part 4 — Subtask Feature
- parentTaskId self-relation on Task already in schema
- POST /api/tasks accepts nested subtasks array recursively
- PATCH /api/tasks/:id blocks "Done" if any direct child is not "Done"
- Frontend TaskFormNode renders recursively with depth-based indentation

## Part 5 — LLM Skill Identification
- Install @google/generative-ai in backend
- Create src/lib/gemini.ts — function identifySkills(title, availableSkills) returns number[]
- Use model gemini-1.5-flash
- Prompt must constrain output to known skills and return ONLY a JSON array of IDs
- If POST /api/tasks receives empty or missing skillIds, call Gemini to identify skills
- Apply recursively to all subtasks in the creation tree
- Fail silently on LLM errors (log and return empty array)
- GEMINI_API_KEY loaded from environment variable

## Part 6 — Docker
backend/Dockerfile:
- FROM node:20-alpine
- Install deps, generate Prisma client, compile TypeScript
- CMD: prisma migrate deploy && conditional seed (only if skill count = 0) && node dist/index.js

frontend/Dockerfile:
- Stage 1: node:20-alpine, npm install, vite build
- Stage 2: nginx:alpine, copy dist, use custom nginx.conf

frontend/nginx.conf:
- Serve static files from /usr/share/nginx/html
- try_files for SPA routing
- Proxy /api to http://backend:3000

docker-compose.yml (in project root):
- db: postgres:15-alpine, healthcheck with pg_isready, named volume
- backend: depends_on db (condition: service_healthy), env DATABASE_URL and GEMINI_API_KEY
- frontend: depends_on backend, port 80:80

Root .env (not committed): GEMINI_API_KEY=<real key>
Root .env.example (committed): GEMINI_API_KEY=

Frontend axios baseURL must be '/api' (relative) not 'http://localhost:3000/api'

## Part 7 — README
Sections: Overview, Tech Stack, Architecture diagram (ASCII), Database Schema,
API Endpoints table, Business Rules, Prerequisites, Configuration,
How to Run, How to Stop, Development Setup, Library Justification

## Known Issues to Avoid
- Prisma generator must be "prisma-client-js" not "prisma-client"
- datasource must include url = env("DATABASE_URL")
- Docker seed must be conditional — check skill count before seeding to avoid duplicates on restart
- GET /api/tasks must include children 4 levels deep (Prisma doesn't support recursive includes)
- GET /api/developers?skillIds= must use distinct to avoid duplicate developers
- Frontend axios calls must return response.data not the full axios response object
- docker-compose build --no-cache is more reliable than --build flag for rebuilding

