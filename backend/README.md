# Obliq Backend

Express + PostgreSQL backend for the RBAC full-stack task.

## Features

- JWT access token auth
- refresh token in httpOnly cookie
- session revocation on logout
- brute-force login throttling
- permission-driven route protection
- grant ceiling enforcement for permission assignment
- user create, edit, suspend, ban flows
- audit logging
- seeded demo data

## Environment

Create `.env` from `.env.example`:

```bash
PORT=4000
APP_ORIGIN=http://localhost:3000
JWT_SECRET=rbac-demo-secret
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

## Run

```bash
npm install
npm run dev
```

## Database

The server auto-creates these tables on startup if they do not exist:

- `users`
- `sessions`
- `audit_logs`
- `leads`
- `tasks`
- `reports`
- `customer_portal`

It also auto-seeds four demo users on first run.

## Demo Accounts

- `admin@obliq.app / Admin123!`
- `manager@obliq.app / Manager123!`
- `agent@obliq.app / Agent123!`
- `customer@obliq.app / Customer123!`
