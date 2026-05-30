# KGDS Front MVP v1

This is a standalone React/Vite frontend MVP for the Knowledge Gap Detection System. It converts the Stitch visual direction into a repo-ready SaaS product shell for school onboarding, admin dashboards, teacher workflows, analytics, reporting, and a restricted developer console.

The existing prototype frontend remains separate and dev-only. This app uses mock data first and does not require a live backend to render.

## Run Locally

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Backend Integration

Backend API placeholders live in `src/services/api.ts`. The UI currently renders from `src/data/mockData.ts`; backend wiring should be added later without changing the public website into an API diagnostics surface.

Developer-only diagnostics belong in `/developer-console`.

For local end-to-end testing, the app defaults to:

```text
http://127.0.0.1:8080
```

Override it with:

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:8080"
npm run dev
```
