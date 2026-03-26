# RBAC System Task Breakdown

## Source Summary

This document is based on:

- `task/Full Stack Task.pdf`
- `task/Login page.pdf`
- The UI screenshots in `img/`

The project is a full-stack RBAC web app with dynamic, permission-based access control. Access is not tied to role labels alone. Every page and action is controlled by permission atoms, and managers can only grant permissions they already have.

## Main Goal

Build a single web application where:

- users log in with JWT authentication
- permissions control route access, visible navigation, and allowed actions
- admins and managers can manage users and permissions through the UI
- managers can only grant permissions within their own permission ceiling
- the system keeps an audit trail of important actions
- the login page matches the provided design
- the whole app is responsive

## Required Stack

### Frontend

- Next.js 14
- App Router
- TypeScript

### Backend

- Developer choice
- NestJS preferred
- Must expose the required REST API for auth, users, permissions, and audit log

### Database

- Developer choice
- PostgreSQL recommended

### Auth

- JWT access token
- Refresh token
- access token lifetime: 15 minutes
- refresh token lifetime: 7 days
- refresh token stored in httpOnly cookie
- no localStorage for auth

## Roles Involved

- Admin
- Manager
- Agent
- Customer

## Core Functional Requirements

### 1. Authentication

- login
- logout
- refresh token flow
- session blacklist
- brute-force rate limiting

### 2. User Management

- create users
- edit users
- suspend users
- ban users
- support lifecycle for all roles

### 3. Permission Management

- permission editor UI
- assign permission atoms to users
- manager/admin can only grant permissions they hold
- permissions affect pages, modules, and actions

### 4. Dynamic Routing

- every route is protected by a required permission atom
- check access before page render
- unauthorized users should be redirected to a 403 page
- role label alone must not decide page access

### 5. Dynamic Sidebar / Navigation

- build navigation from resolved permissions
- show only modules/pages the user can access

### 6. Core Modules

- Dashboard
- Users
- Leads
- Tasks
- Reports
- Audit Log
- Customer Portal
- Settings

### 7. Audit Trail

- append-only audit log
- track admin/manager actions
- include who did what and when

### 8. Responsive UI

- login page must follow the provided Figma/screenshots
- the website must be responsive across devices and screen sizes

## UI Notes From Screenshots And Figma PDF

- brand shown as `Obliq`
- login screen uses a large two-column composition on desktop
- left side contains the login card
- right side shows the app preview with orange/yellow abstract background
- Figma PDF confirms the login page is broken into reusable UI pieces, including:
  - email input
  - password input
  - primary log in button
  - sign up text/button treatment
  - forgot password link treatment
- visible login elements:
  - email field
  - password field
  - remember me checkbox
  - forgot password link
  - log in button
  - sign up link
- internal dashboard preview shows:
  - left sidebar
  - tasks list view
  - kanban cards
  - soft rounded UI with warm orange gradients

## Login Page UI Requirements From Figma PDF

- Page title: `Login`
- Subtitle: `Enter your details to continue`
- Fields required:
  - Email
  - Password
- Placeholder examples shown:
  - `example@email.com`
  - `Enter your password`
- Secondary controls required:
  - `Remember me`
  - `Forgot password?`
- Primary action:
  - `Log in`
- Footer prompt:
  - `Don't have an account? Sign up`
- The PDF appears to separate the login page into reusable components, so implementation should keep inputs, button, and helper actions componentized.
- Desktop layout should preserve the split-screen presentation from the design.
- Mobile layout should stack content cleanly while preserving the same visual identity.

## Deliverables

- frontend GitHub repository
- backend GitHub repository
- meaningful commit history
- live deployment link
- responsive implementation
- login page matching the design
- permission-based routing and UI behavior

## Important Constraints

- finish within 24 hours
- use a shared app, not separate apps per role
- permissions must drive rendering and access
- managers cannot grant more access than they have
- no localStorage for auth tokens

## Missing Information / Assumptions

- The task PDF mentions a `Prototype link` and `Figma link`, but the actual URLs were not present in the extracted content.
- The `Login page.pdf` confirms the login content and component structure, but exact spacing, color token values, and interaction settings are mostly embedded graphically rather than as extractable text.
- The PDF references a REST API contract, but the exact endpoint list is not included in the visible extracted pages. That will need to be defined during implementation if not provided separately.

## Step-by-Step Execution Plan

### Phase 1: Setup the project structure

1. Create separate repositories or folders for `frontend` and `backend`.
2. Initialize the frontend with Next.js 14, App Router, and TypeScript.
3. Initialize the backend with NestJS.
4. Set up PostgreSQL and create environment files.
5. Define base shared concepts:
   - roles
   - permissions
   - auth rules
   - user statuses such as active, suspended, banned

### Phase 2: Design the data model

1. Create database schema for:
   - users
   - roles
   - permissions
   - role_permissions
   - user_permissions
   - refresh_tokens or sessions
   - audit_logs
2. Decide whether permissions are:
   - role defaults plus user overrides
   - or fully user-driven with optional role templates
3. Add fields for:
   - created_by
   - manager_id or ownership scope
   - status
   - banned_at
   - suspended_at
4. Add indexes for auth lookup, permission lookup, and audit filtering.

### Phase 3: Build authentication

1. Implement login endpoint.
2. Validate credentials securely.
3. Issue:
   - short-lived access token
   - refresh token in httpOnly cookie
4. Implement refresh endpoint.
5. Implement logout endpoint with token/session invalidation.
6. Add brute-force protection on login.
7. Add middleware/guard checks for banned and suspended users.

### Phase 4: Implement permission resolution

1. Define permission atoms such as:
   - `dashboard.view`
   - `users.view`
   - `users.create`
   - `users.edit`
   - `users.suspend`
   - `reports.view`
   - `audit.view`
2. Create backend service to resolve effective permissions per user.
3. Enforce grant ceiling:
   - admin/manager can only assign permissions they currently possess
4. Add tests for permission inheritance and grant ceiling logic.

### Phase 5: Build backend modules

1. Auth module
2. Users module
3. Permissions module
4. Audit logs module
5. Core domain modules:
   - dashboard
   - leads
   - tasks
   - reports
   - settings
   - customer portal
6. Add audit logging for important mutations.

### Phase 6: Build frontend auth flow

1. Create login page based on `task/Login page.pdf` and the screenshots.
2. Handle form validation and API integration.
3. Store access token in memory only.
4. Use refresh cookie flow for silent session refresh.
5. Build protected app shell.
6. Add logout behavior.
7. Keep login UI pieces reusable:
   - input component
   - password field with visibility toggle support if needed
   - primary button
   - helper links/actions

### Phase 7: Add route protection in Next.js

1. Map each page route to a required permission atom.
2. Implement `middleware.ts` to:
   - validate session presence
   - redirect unauthenticated users to login
   - redirect unauthorized users to 403
3. Ensure server-side protection happens before page render.
4. Add frontend helpers for action-level permission checks.

### Phase 8: Build dynamic UI rendering

1. Build sidebar config from resolved permissions.
2. Show/hide menu items dynamically.
3. Show/hide buttons and actions based on permission atoms.
4. Ensure the same permission rules are enforced in backend APIs.

### Phase 9: Implement management pages

1. User list page
2. User create/edit page
3. Suspend/ban actions
4. Permission editor UI
5. Audit log page
6. Dashboard and task-related pages shown in the design direction

### Phase 10: Responsive design pass

1. Match login page styling to the provided Figma PDF and screenshots.
2. Build mobile, tablet, and desktop layouts.
3. Verify forms, sidebar, tables, and kanban sections adapt correctly.
4. Check spacing, typography, button states, and overflow behavior.

### Phase 11: Testing

1. Test login, refresh, logout.
2. Test suspended/banned access behavior.
3. Test permission-based route blocking.
4. Test manager grant ceiling.
5. Test sidebar visibility by user permission set.
6. Test responsive layouts.
7. Test audit log creation on sensitive actions.

### Phase 12: Deployment and submission

1. Deploy frontend.
2. Deploy backend.
3. Configure production environment variables.
4. Verify cookie/auth behavior in production.
5. Push clean commits with meaningful messages.
6. Submit:
   - frontend repo
   - backend repo
   - live deployment link

## Suggested Build Order For Fast Delivery

If the task must be completed quickly, use this order:

1. Set up frontend and backend skeletons.
2. Build auth flow.
3. Build permission model and route protection.
4. Build login page to match design.
5. Build user management and permission editor.
6. Build sidebar and protected modules.
7. Add audit logging.
8. Do responsive pass.
9. Test critical flows.
10. Deploy and submit.

## Recommended API / Module Checklist

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `POST /users/:id/suspend`
- `POST /users/:id/ban`
- `GET /permissions`
- `GET /users/:id/permissions`
- `PATCH /users/:id/permissions`
- `GET /audit-logs`

## Suggested Permission Atom Examples

- `dashboard.view`
- `users.view`
- `users.create`
- `users.edit`
- `users.suspend`
- `users.ban`
- `permissions.view`
- `permissions.assign`
- `leads.view`
- `tasks.view`
- `reports.view`
- `audit.view`
- `settings.view`
- `customer_portal.view`

## Final Interpretation

This is not just a role-based dashboard task. The core of the assignment is building a dynamic permission system where:

- permissions drive routing
- permissions drive navigation
- permissions drive UI actions
- managers are limited by their own permission set
- the app remains responsive and visually aligned with the provided design
