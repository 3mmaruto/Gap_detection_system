# School Management — Frontend

React 19 + TypeScript + Vite + Bootstrap 5. No state/data libraries — all
fetching and state live in custom hooks under `src/hooks/`.

## Scripts
- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run lint` — eslint

## Structure
```
src/
  lib/        api.ts (fetch wrapper + endpoint map), school.ts (constants/nav)
  types/      models.types.ts (ERD), api.types.ts (transport), schedule.types.ts
  hooks/      useAuth, useApi, useFilter, usePagination, useDebounce,
              useSchedule, useSubjects, usePosts, useUsers, useProgress,
              useNotifications, useMessages
  components/
    providers/  AuthProvider
    routing/    ProtectedRoute (role guards)
    layout/     AppLayout (Header + page shell)
    ui/         Card
    views/      HomeView, CurriculumView (shared across roles)
    Header/ Filters/ Tables/ Post/ Progress/ Login/
  pages/      thin route components (Student/Teacher/Admin/Common)
```

## Backend contract
`src/lib/backend.ts` sets `API_BASE_URL`. **Every** route string lives in the
`endpoints` map in `src/lib/api.ts` — adjust there to match the FastAPI router.
Assumed routes (REST conventions):

- `POST /auth/login` → `{ access_token, user }`
- `POST /auth/logout`, `GET /auth/me` → current `User`
- `GET /users`, `/students`, `/subjects`, `/posts` → `Paginated<T>`
- `GET /schedule?week=YYYY-MM-DD` → `WeekSchedule`
- `GET /students/{id}/progress?subject_id=` → `{ percent }`
- `GET /notifications` → `Notification[]`
- `GET /conversations` → `Conversation[]`

Auth is a Bearer JWT stored in `localStorage` and injected by `apiFetch`.

## Known follow-ups (not done this pass)
- Stub pages still empty: `Common/Profile`, `Common/Notifications`,
  `Teacher/AddPost`, `Admin/AddPost`, `Admin/AddUser` (and their routes).
- Curriculum is one "Resources" section. The old Books / Homeworks / Missed
  topics / Syllabus split needs a `category` column on `Post` (or to be derived
  from `Topic` / `SyllabusItem`) before it can be populated for real.
- `ItemsTable` paginates/searches client-side; the list endpoints already accept
  `page`/`search` for server-side paging when datasets grow.
