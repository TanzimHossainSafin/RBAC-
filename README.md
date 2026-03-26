# Full Stack Task Submission

This workspace contains a complete RBAC-oriented full-stack implementation based on the provided PDF brief and login-page Figma export.

## Structure

- [frontend](/Users/tanzim_safin/Desktop/fullstack%20task/frontend): Next.js 14 app
- [backend](/Users/tanzim_safin/Desktop/fullstack%20task/backend): Express + PostgreSQL API
- [task.md](/Users/tanzim_safin/Desktop/fullstack%20task/task.md): extracted requirement breakdown and implementation plan

## Implemented

- dynamic permission-based routing
- dynamic sidebar from resolved permissions
- JWT auth with refresh cookie
- user CRUD-oriented flows
- suspend and ban actions
- permission assignment UI with grant ceiling logic
- audit log API and UI
- dashboard, users, leads, tasks, reports, customer portal, and settings pages
- responsive login screen aligned to the provided design direction

## Verification

- frontend production build passes
- backend TypeScript check passes
- Neon PostgreSQL connectivity verified
- seeded users confirmed in database

## Local Run

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

# RBAC-
