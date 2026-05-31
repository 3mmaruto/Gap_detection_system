# KGDS Student/Teacher Portal

React 19 + TypeScript + Vite + Bootstrap 5 portal adapted from the partner
school-management frontend. It is intended to run beside
`frontend/front_mvp_v1`:

- `front_mvp_v1`: school admin portal and KGDS analysis workflow.
- `partner_frontend`: student and teacher portal.

Both frontends use the same KGDS FastAPI backend and PostgreSQL database.
The old partner NestJS/Prisma backend is not required for this integration.

## Scripts

- `npm run dev` - dev server
- `npm run build` - type-check + production build
- `npm run lint` - eslint

For local KGDS development:

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:8080/api"
npm run dev -- --host 127.0.0.1 --port 5174
```

Demo accounts after running the KGDS demo bootstrap:

- Student: `Sami Al-Hassan` / `student`
- Teacher: `teacher` / `teacher`

## Structure

```text
src/
  lib/        api.ts, backend.ts, routes.tsx, school.ts
  types/      models.types.ts, api.types.ts, schedule.types.ts
  hooks/      useAuth, useApi, useSchedule, useSubjects, usePosts, useUsers
  components/ providers, routing, layout, views, Header, Tables, Post, Progress
  pages/      Student, Teacher, Admin, Common
```

## Backend contract

`src/lib/backend.ts` sets `API_BASE_URL`. Every route string lives in
`src/lib/api.ts`. The FastAPI backend exposes a compatibility router under
`/api/*` so this portal can keep its original route shape while using KGDS
SQLAlchemy/Alembic tables.

- `POST /api/auth/v1/login` -> `{ access_token, user }`
- `GET /api/auth/v1/me` -> current `User`
- `GET /api/users/v1`, `/api/students/v1`, `/api/posts/v1` -> `Paginated<T>`
- `GET /api/levels/v1`, `/api/subjects/v1` -> school reference lists
- `GET /api/schedule/v1` -> current week schedule
- `GET /api/students/v1/{id}/history` -> prior school history
- `GET /api/students/v1/{id}/progress` -> `{ percent }`
- `GET /api/notifications/v1` -> `Notification[]`
- `GET /api/conversations/v1` -> `Conversation[]`

Auth is a Bearer JWT stored in `localStorage` and injected by `apiFetch`.

## Known Follow-Ups

- Some admin-specific partner pages remain secondary because KGDS uses
  `front_mvp_v1` as the school-admin portal.
- File uploads and full RBAC enforcement are still placeholders.
- This portal should not run the partner NestJS/Prisma backend in the KGDS MVP.
