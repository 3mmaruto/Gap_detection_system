# Database Architecture

KGDS now has a PostgreSQL-ready database foundation while keeping the current Google Sheet rule-based pipeline as the default runtime path.

## Current Workflow Before DB Changes

- `backend/app/main.py` builds the FastAPI app and mounts health, analysis, and graph routes.
- `POST /analyze-student-case` validates `StudentCaseInput`, calls `analyze_student_case`, and returns the existing summary/report/support topics/graph summary shape.
- `POST /student-graph` and `POST /curriculum-graph` call the existing rule-based graph builders and return `{ nodes, edges }`.
- `backend/app/logic/data_loader.py` loads Google Sheet/CSV data into pandas DataFrames expected by the rule engine.
- `backend/app/logic/analysis.py` keeps the rule-based gap detection logic: target topic extraction, prerequisite matching, coverage inference, teacher alert report, support-first topics, and graph-ready output.

## PostgreSQL Architecture Summary

The schema treats KGDS as a specialized subsystem inside a broader school decision-support platform:

- School backbone: `schools`, `academic_years`, `users`, `roles`, `permissions`, `students`, `class_sections`, `enrollments`, `teacher_assignments`.
- Curriculum knowledge base: `curriculum_systems`, `curriculum_versions`, `curriculum_topics`, `curriculum_edges`, `curriculum_equivalences`.
- Student/case evidence: `student_cases`, `student_education_paths`, `uploaded_documents`, `document_extraction_jobs`, `extracted_records`.
- Rule outputs: `analysis_runs`, `detected_gaps`, `support_recommendations`, `graph_snapshots`.
- Future AI readiness: `model_versions`, `model_outputs`, `fusion_results`, `agent_tasks`.
- Follow-up and governance: `teacher_reports`, `teacher_feedback`, `intervention_plans`, `intervention_progress`, `analytics_snapshots`, `audit_logs`, `system_events`.

## Configuration

Set `DATABASE_URL` only when you want PostgreSQL-backed features:

```powershell
$env:DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/kgds"
```

The default rule engine still reads from Google Sheets unless you opt in:

```powershell
$env:KGDS_DATA_SOURCE="postgres"
```

If `KGDS_DATA_SOURCE=postgres` and the DB is unavailable, the loader falls back to Google Sheets unless:

```powershell
$env:KGDS_DB_REQUIRED="true"
```

Optional analysis persistence:

```powershell
$env:KGDS_PERSIST_ANALYSIS="true"
```

## Migrations

From `backend/`:

```powershell
alembic upgrade head
```

The initial migration creates the SQLAlchemy metadata tables. It is intended as the first MVP baseline migration.

## Seed Roles

After migrations:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8080/db/seed-roles
```

## Import Google Sheet Data

Start the backend with `DATABASE_URL`, then call:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8080/curriculum/import -ContentType "application/json" -Body "{}"
```

This imports:

- topics into `curriculum_topics`
- prerequisites into `curriculum_edges`
- prototype student cases into `student_cases` with `source_type="prototype"`

The import uses upsert logic through:

- `curriculum_topics.external_topic_id`
- source/target topic ids for edges
- `student_cases.case_code`

## Backward-Compatible Rule Engine Path

The safe transition path is:

1. Keep default Google Sheet data loading.
2. Import the sheets into PostgreSQL.
3. Set `KGDS_DATA_SOURCE=postgres`.
4. The backend reads PostgreSQL rows back into DataFrames with the same column names expected by the existing rule-based pipeline.

Existing endpoints remain:

- `GET /health`
- `POST /analyze-student-case`
- `POST /student-graph`
- `POST /curriculum-graph`

New DB endpoints include:

- `GET /db/health`
- `POST /db/seed-roles`
- `POST /schools`
- `GET /schools`
- `GET /schools/{id}`
- `PATCH /schools/{id}`
- `POST /students`
- `GET /students`
- `GET /students/{id}`
- `PATCH /students/{id}`
- `POST /student-cases`
- `GET /student-cases`
- `GET /student-cases/{id}`
- `POST /curriculum/import`
- `GET /curriculum/topics`
- `GET /curriculum/edges`
- `GET /analysis-runs`
- `GET /analysis-runs/{id}`
- `GET /detected-gaps`
- `GET /support-recommendations`

## Mermaid ER Overview

```mermaid
erDiagram
    schools ||--o{ students : has
    schools ||--o{ class_sections : has
    schools ||--o{ user_roles : scopes
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : assigned
    roles ||--o{ role_permissions : grants
    permissions ||--o{ role_permissions : included
    class_sections ||--o{ enrollments : contains
    students ||--o{ enrollments : joins
    users ||--o{ teacher_assignments : teaches
    class_sections ||--o{ teacher_assignments : assigned
    subjects ||--o{ teacher_assignments : subject

    curriculum_systems ||--o{ curriculum_versions : versions
    curriculum_systems ||--o{ curriculum_topics : owns
    curriculum_versions ||--o{ curriculum_topics : versioned
    subjects ||--o{ curriculum_topics : classifies
    curriculum_topics ||--o{ curriculum_edges : source
    curriculum_topics ||--o{ curriculum_edges : target
    curriculum_topics ||--o{ curriculum_equivalences : aligns

    students ||--o{ student_cases : may_have
    student_cases ||--o{ analysis_runs : analyzed_by
    analysis_runs ||--o{ detected_gaps : generates
    analysis_runs ||--o{ support_recommendations : generates
    analysis_runs ||--o{ graph_snapshots : stores
    curriculum_topics ||--o{ detected_gaps : topic
    curriculum_topics ||--o{ support_recommendations : topic

    uploaded_documents ||--o{ document_extraction_jobs : processed_by
    document_extraction_jobs ||--o{ extracted_records : yields
    agent_tasks }o--|| users : requested_by

    analysis_runs ||--o{ model_outputs : receives
    model_versions ||--o{ model_outputs : produces
    analysis_runs ||--o{ fusion_results : fuses
    analysis_runs ||--o{ teacher_reports : renders
    teacher_reports ||--o{ teacher_feedback : receives
```

Use `docs/kgds_schema.dbml` with dbdiagram.io for a cleaner printable ERD/PDF.
