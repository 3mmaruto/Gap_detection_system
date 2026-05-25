# KGDS Local Dev Runbook

## Purpose

Use this runbook for clean local backend startup and for verifying that analysis persistence is writing to PostgreSQL.

## Required Environment Variables

From `backend/` set:

```powershell
$env:DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/kgds"
$env:KGDS_PERSIST_ANALYSIS="true"
$env:KGDS_DATA_SOURCE="postgres"
$env:KGDS_DB_REQUIRED="true"
```

Notes:

- `DATABASE_URL` enables SQLAlchemy and PostgreSQL-backed routes.
- `KGDS_PERSIST_ANALYSIS=true` enables persistence inside `POST /analyze-student-case`.
- `KGDS_DATA_SOURCE=postgres` makes the rule engine read curriculum data from PostgreSQL instead of sheets.
- `KGDS_DB_REQUIRED=true` prevents silent fallback away from the database.

## Clean Backend Startup

Work from `backend/`.

1. Check whether port `8080` is already in use:

```powershell
netstat -ano | Select-String ":8080"
```

2. If anything is listening on `8080`, stop it before starting a new backend:

```powershell
taskkill /PID <PID> /F
```

3. Start the backend in one clean process without reload:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8080
```

Do not use `--reload` for persistence verification. A stale listener on `8080` previously caused requests to hit an old process.

## Health Checks

Basic app health:

```text
GET http://127.0.0.1:8080/health
```

Database and persistence guard health:

```text
GET http://127.0.0.1:8080/db/health
```

Expected `db/health` fields:

- `configured`
- `ok`
- `persist_analysis`
- `database_configured`
- `session_local_available`

For persistence testing, these should all indicate readiness:

- `configured = true`
- `ok = true`
- `persist_analysis = true`
- `database_configured = true`
- `session_local_available = true`

## Detecting Stale Windows Listeners

Useful commands:

```powershell
netstat -ano | Select-String ":8080"
Get-NetTCPConnection -LocalPort 8080 -State Listen
tasklist /FI "PID eq <PID>"
taskkill /PID <PID> /F
```

If multiple listeners or stale listeners appear on `8080`, stop all of them before starting a fresh backend process.

## Persistence Smoke Test

Call:

```text
POST http://127.0.0.1:8080/analyze-student-case
```

Example payload:

```json
{
  "case_id": "SC_SMOKE_PERSIST_CLEAN_001",
  "origin_country": "Turkey",
  "grades_studied_abroad": ["9", "10", "11"],
  "last_completed_grade_abroad": "11",
  "target_country": "Syria",
  "target_grade": "12",
  "target_stream": "Scientific",
  "subject_focus": "Math",
  "overall_difficulty": 6,
  "math_difficulty": 7,
  "notes": "Persisted smoke test for analyze-student-case",
  "extra_fields": {}
}
```

Success indicators:

- HTTP `200`
- `summary.analysis_run_id` is present in the response

## Persistence Verification Counts

Verify in PostgreSQL:

```powershell
docker exec kgds-postgres psql -U postgres -d kgds -c "SELECT COUNT(*) FROM analysis_runs;"
docker exec kgds-postgres psql -U postgres -d kgds -c "SELECT COUNT(*) FROM detected_gaps;"
docker exec kgds-postgres psql -U postgres -d kgds -c "SELECT COUNT(*) FROM support_recommendations;"
docker exec kgds-postgres psql -U postgres -d kgds -c "SELECT COUNT(*) FROM graph_snapshots;"
```

Expected successful state:

- `analysis_runs > 0`
- `detected_gaps > 0`
- `support_recommendations > 0`
- `graph_snapshots > 0`

## Note About Graph Snapshots

`graph_snapshots` stores graph JSON payloads (`nodes_json` and `edges_json`). It does not store a rendered image.
