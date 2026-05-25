# KGDS API Reference

## Overview

The FastAPI backend currently exposes two API styles:

- Legacy rule-engine endpoints that analyze curriculum gaps from Google Sheets or CSV files by default.
- PostgreSQL-backed CRUD and reporting endpoints that read and write the migrated KGDS schema.

The app entry point is `backend/app/main.py`. Registered routers come from:

- `app.routes.health`
- `app.routes.db_health`
- `app.routes.schools`
- `app.routes.students`
- `app.routes.student_cases`
- `app.routes.curriculum`
- `app.routes.analysis_runs`
- `app.routes.recommendations`
- `app.routes.analysis`
- `app.routes.graphs`

## Base URL

Local development base URL:

```text
http://127.0.0.1:8080
```

Built-in FastAPI docs routes:

- `GET /docs`
- `GET /redoc`
- `GET /openapi.json`

## Environment Variables

### `DATABASE_URL`

- Example: `postgresql+psycopg://postgres:postgres@localhost:5432/kgds`
- Used by SQLAlchemy session setup in `backend/app/db/session.py`.
- Required for PostgreSQL-backed routes that depend on `get_db()`.
- If missing, database CRUD/import/read endpoints fail at request time.

### `KGDS_DATA_SOURCE`

- Default: `sheets`
- Accepted PostgreSQL-oriented values in code: `postgres`, `postgresql`, `db`
- Controls the data source used by the legacy rule-engine pipeline in `backend/app/logic/data_loader.py`.
- When set to PostgreSQL and the database is available, `/analyze-student-case`, `/student-graph`, and `/curriculum-graph` read curriculum data from database-backed dataframes instead of Google Sheets / CSV.

### `KGDS_PERSIST_ANALYSIS`

- Default: `false`
- When `true`, `POST /analyze-student-case` persists the generated result to PostgreSQL if `DATABASE_URL` is configured.
- The response `summary` may then include `analysis_run_id`.

### `KGDS_DB_REQUIRED`

- Default: `false`
- Used in two places:
  - SQLAlchemy setup marks database use as required for runtime policy decisions.
  - The rule-engine data loader refuses to fall back to sheets/CSV when PostgreSQL loading fails.
- Practical effect: if `KGDS_DATA_SOURCE=postgres` and loading from DB fails, requests raise an error instead of silently falling back.

## Route Groups

### Health and Platform

#### `GET /health`

- Purpose: basic process health check.
- Request body: none.
- Response: object with `status` and `service`.
- Data source: none.

Example response:

```json
{
  "status": "ok",
  "service": "gap-detection-backend"
}
```

#### `GET /db/health`

- Purpose: check whether `DATABASE_URL` is configured and whether the DB ping succeeds.
- Request body: none.
- Response: object with `configured` and `ok`.
- Data source: PostgreSQL infrastructure check.

Example response:

```json
{
  "configured": true,
  "ok": true
}
```

#### `POST /db/seed-roles`

- Purpose: seed roles, permissions, and role-permission links.
- Request body: none.
- Response: `RoleSeedResponse`
  - `roles_created`
  - `permissions_created`
  - `role_permissions_created`
- Data source: PostgreSQL-backed.
- Note: this route mutates database state and is not part of the teacher workflow.

### Legacy Rule Engine and Graph Output

These endpoints are registered in `analysis.py` and `graphs.py`. They are legacy in the sense that their logic still runs through `app.logic.analysis` and `app.logic.data_loader`. By default they use Google Sheets / CSV data, not the relational API tables. They can read from PostgreSQL only when `KGDS_DATA_SOURCE` is switched to a DB mode and the curriculum tables are populated.

#### `POST /analyze-student-case`

- Purpose: run the rule-based gap analysis for one student case.
- Request body: `StudentCaseInput`
  - `case_id`
  - `origin_country`
  - `grades_studied_abroad`
  - `last_completed_grade_abroad`
  - `target_country`
  - `target_grade`
  - `target_stream`
  - `subject_focus`
  - `overall_difficulty`
  - `math_difficulty`
  - `notes`
  - `extra_fields`
- Response: `AnalysisResponse`
  - `summary`
  - `teacher_alert_report`
  - `support_first_topics`
  - `graph_summary`
- Notes:
  - Returns `503` if curriculum data cannot be loaded.
  - If `KGDS_PERSIST_ANALYSIS=true` and DB is configured, the analysis is also stored in PostgreSQL.

#### `POST /student-graph`

- Purpose: return graph-ready nodes and edges for a specific student case.
- Request body: same `StudentCaseInput` used by `/analyze-student-case`.
- Response: `GraphResponse`
  - `nodes`: list of graph node objects
  - `edges`: list of graph edge objects
- Notes:
  - Returns `503` if curriculum data cannot be loaded.
  - Intended for frontend graph visualization.

#### `POST /curriculum-graph`

- Purpose: return a curriculum slice as graph-ready nodes and edges.
- Request body: `CurriculumGraphInput`
  - `country`
  - `grade`
  - `stream`
  - `subject`
  - `core_only`
- Response: `GraphResponse`
  - `nodes`
  - `edges`
- Notes:
  - Returns `503` if curriculum data cannot be loaded.

### Schools

All school endpoints are PostgreSQL-backed and require `DATABASE_URL`.

#### `POST /schools`

- Purpose: create a school.
- Request body: `SchoolCreate`
  - `name`
  - `code`
  - `type`
  - `country`
  - `city`
  - `region`
  - `address`
  - `status`
- Response: `SchoolRead`
  - all create fields plus `id`, `created_at`, `updated_at`

#### `GET /schools`

- Purpose: list schools.
- Query params:
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `SchoolRead`

#### `GET /schools/{school_id}`

- Purpose: fetch one school by numeric ID.
- Response: `SchoolRead`
- Errors:
  - `404` when the school does not exist.

#### `PATCH /schools/{school_id}`

- Purpose: update selected school fields.
- Request body: `SchoolUpdate`
- Response: `SchoolRead`
- Errors:
  - `404` when the school does not exist.

### Students

All student endpoints are PostgreSQL-backed and require `DATABASE_URL`.

#### `POST /students`

- Purpose: create a student.
- Request body: `StudentCreate`
  - `school_id`
  - `student_number`
  - `first_name`
  - `father_name`
  - `mother_name`
  - `last_name`
  - `full_name`
  - `date_of_birth`
  - `gender`
  - `nationality`
  - `current_grade`
  - `current_stream`
  - `current_section_id`
  - `status`
- Response: `StudentRead`
  - all create fields plus `id`, `created_at`, `updated_at`

#### `GET /students`

- Purpose: list students.
- Query params:
  - `school_id` optional
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `StudentRead`

#### `GET /students/{student_id}`

- Purpose: fetch one student by numeric ID.
- Response: `StudentRead`
- Errors:
  - `404` when the student does not exist.

#### `PATCH /students/{student_id}`

- Purpose: update selected student fields.
- Request body: `StudentUpdate`
- Response: `StudentRead`
- Errors:
  - `404` when the student does not exist.

### Student Cases

All student-case endpoints are PostgreSQL-backed and require `DATABASE_URL`.

#### `POST /student-cases`

- Purpose: create a persisted student case record.
- Request body: `StudentCaseCreate`
  - `student_id`
  - `school_id`
  - `case_code`
  - `origin_country`
  - `target_country`
  - `target_grade`
  - `target_stream`
  - `subject_focus`
  - `grades_studied_abroad`
  - `last_completed_grade_abroad`
  - `overall_difficulty`
  - `math_difficulty`
  - `reading_difficulty`
  - `notes`
  - `raw_input_json`
  - `source_type`
  - `created_by_user_id`
  - `status`
- Response: `StudentCaseRead`
  - all create fields plus `id`, `created_at`, `updated_at`

#### `GET /student-cases`

- Purpose: list stored student cases.
- Query params:
  - `source_type` optional
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `StudentCaseRead`

#### `GET /student-cases/{case_id}`

- Purpose: fetch one stored student case by numeric ID.
- Response: `StudentCaseRead`
- Errors:
  - `404` when the record does not exist.

### Curriculum Import and Read APIs

These endpoints are PostgreSQL-backed. `POST /curriculum/import` bridges the legacy Google Sheet / CSV source into the relational schema.

#### `POST /curriculum/import`

- Purpose: import topics, edges, and prototype student cases from the configured sheet/CSV source into PostgreSQL.
- Request body: `CurriculumImportRequest`
  - `source_type` default `google_sheet`
  - `source_uri`
  - `import_topics`
  - `import_edges`
  - `import_student_cases`
- Response: `CurriculumImportResponse`
  - `batch_id`
  - `status`
  - `summary`
- Notes:
  - This is PostgreSQL-backed, but the source data currently comes from Google Sheets or CSV files.
  - It is the main bridge from prototype data into the relational model.

#### `GET /curriculum/topics`

- Purpose: list curriculum topics already stored in PostgreSQL.
- Query params:
  - `country`
  - `grade`
  - `stream`
  - `subject_id`
  - `q`
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `CurriculumTopicRead`
  - `id`
  - `external_topic_id`
  - `country`
  - `grade`
  - `stream`
  - `subject_id`
  - `subject_branch`
  - `topic_name_native`
  - `topic_name_en`
  - `topic_order`
  - `is_core_topic`

#### `GET /curriculum/edges`

- Purpose: list curriculum edges already stored in PostgreSQL.
- Query params:
  - `relation_type`
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `CurriculumEdgeRead`
  - `id`
  - `source_topic_id`
  - `target_topic_id`
  - `relation_type`
  - `weight`
  - `description`
  - `metadata_json`

### Analysis Persistence Read APIs

These endpoints are PostgreSQL-backed and expose previously persisted outputs.

#### `GET /analysis-runs`

- Purpose: list saved analysis runs.
- Query params:
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `AnalysisRunRead`
  - `id`
  - `case_id`
  - `student_id`
  - `school_id`
  - `analysis_type`
  - `status`
  - `started_at`
  - `completed_at`
  - `error_message`

#### `GET /analysis-runs/{run_id}`

- Purpose: fetch one persisted analysis run.
- Response: `AnalysisRunRead`
- Errors:
  - `404` when the run does not exist.

#### `GET /detected-gaps`

- Purpose: list persisted detected-gap rows.
- Query params:
  - `analysis_run_id` optional
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `DetectedGapRead`
  - `id`
  - `analysis_run_id`
  - `topic_id`
  - `gap_type`
  - `severity_score`
  - `status`
  - `evidence_json`
  - `explanation_text`

#### `GET /support-recommendations`

- Purpose: list persisted support recommendations.
- Query params:
  - `analysis_run_id` optional
  - `limit` default `100`
  - `offset` default `0`
- Response: list of `SupportRecommendationRead`
  - `id`
  - `analysis_run_id`
  - `topic_id`
  - `priority_rank`
  - `recommendation_type`
  - `reason_text`
  - `evidence_json`

## Request and Response Model Notes

### Legacy analysis schemas

Defined in `backend/app/models/student_case.py`:

- `StudentCaseInput`
- `CurriculumGraphInput`
- `AnalysisResponse`
- `GraphResponse`

These responses are intentionally flexible and use nested `dict[str, Any]` or `list[dict[str, Any]]` structures, so the OpenAPI schema is broad rather than strongly typed.

### PostgreSQL-backed schemas

Defined in `backend/app/schemas/db.py`:

- `SchoolCreate`, `SchoolUpdate`, `SchoolRead`
- `StudentCreate`, `StudentUpdate`, `StudentRead`
- `StudentCaseCreate`, `StudentCaseRead`
- `CurriculumImportRequest`, `CurriculumImportResponse`
- `CurriculumTopicRead`, `CurriculumEdgeRead`
- `AnalysisRunRead`, `DetectedGapRead`, `SupportRecommendationRead`
- `RoleSeedResponse`

## Route Classification Summary

### Infrastructure-neutral

- `GET /health`

### Legacy Google Sheet / CSV rule-engine routes by default

- `POST /analyze-student-case`
- `POST /student-graph`
- `POST /curriculum-graph`

### PostgreSQL-backed CRUD, import, and reporting routes

- `GET /db/health`
- `POST /db/seed-roles`
- `POST /schools`
- `GET /schools`
- `GET /schools/{school_id}`
- `PATCH /schools/{school_id}`
- `POST /students`
- `GET /students`
- `GET /students/{student_id}`
- `PATCH /students/{student_id}`
- `POST /student-cases`
- `GET /student-cases`
- `GET /student-cases/{case_id}`
- `POST /curriculum/import`
- `GET /curriculum/topics`
- `GET /curriculum/edges`
- `GET /analysis-runs`
- `GET /analysis-runs/{run_id}`
- `GET /detected-gaps`
- `GET /support-recommendations`

## OpenAPI Export

If `docs/openapi.json` is not generated automatically, export it manually later with:

```powershell
cd backend
uvicorn app.main:app --reload --port 8080
```

Then open:

```text
http://127.0.0.1:8080/openapi.json
```
