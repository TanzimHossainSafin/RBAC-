# Obliq Frontend

Next.js 14 frontend for the RBAC full-stack task.

## Features

- Figma-inspired login page
- App Router based protected pages
- middleware route gating using signed permission hint cookie
- dynamic sidebar from resolved user permissions
- user management UI
- permission editor UI
- responsive dashboard modules

## Environment

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
JWT_SECRET=rbac-demo-secret
```

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Demo Accounts

- `admin@obliq.app / Admin123!`
- `manager@obliq.app / Manager123!`
- `agent@obliq.app / Agent123!`
- `customer@obliq.app / Customer123!`
