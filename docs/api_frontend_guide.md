# KGDS Frontend API Guide

## Recommended Integration Flow

Use the backend in two layers:

1. Platform checks
   - `GET /health`
   - `GET /db/health` when the frontend needs PostgreSQL-backed features
2. Master data creation
   - `POST /schools`
   - `POST /students`
   - `POST /student-cases`
3. Analysis and graph flow
   - `POST /analyze-student-case`
   - `POST /student-graph`
   - `POST /curriculum-graph`
4. PostgreSQL-backed exploration
   - `GET /curriculum/topics`
   - `GET /curriculum/edges`
   - `GET /analysis-runs`
   - `GET /detected-gaps`
   - `GET /support-recommendations`

## Which Endpoints To Call First

### For a frontend that only needs the existing prototype analysis

1. `GET /health`
2. `POST /analyze-student-case`
3. `POST /student-graph`
4. `POST /curriculum-graph`

### For a frontend that uses the relational KGDS workflow

1. `GET /health`
2. `GET /db/health`
3. `POST /schools`
4. `POST /students`
5. `POST /student-cases`
6. `POST /analyze-student-case`
7. Optionally read persisted outputs with:
   - `GET /analysis-runs`
   - `GET /detected-gaps`
   - `GET /support-recommendations`

### For admin/import tooling

1. `GET /db/health`
2. `POST /curriculum/import`
3. `GET /curriculum/topics`
4. `GET /curriculum/edges`

## Example Requests

### `POST /schools`

```json
{
  "name": "Damascus Pilot School",
  "code": "DPS-001",
  "type": "public",
  "country": "Syria",
  "city": "Damascus",
  "region": "Damascus",
  "address": "Al Malki",
  "status": "active"
}
```

### `POST /students`

```json
{
  "school_id": 1,
  "student_number": "2026-0001",
  "first_name": "Ahmad",
  "father_name": "Khaled",
  "mother_name": "Rana",
  "last_name": "Ali",
  "full_name": "Ahmad Khaled Ali",
  "date_of_birth": "2008-04-12",
  "gender": "male",
  "nationality": "Syrian",
  "current_grade": "12",
  "current_stream": "Scientific",
  "current_section_id": null,
  "status": "active"
}
```

### `POST /student-cases`

```json
{
  "student_id": 1,
  "school_id": 1,
  "case_code": "SC_DEMO_001",
  "origin_country": "Turkey",
  "target_country": "Syria",
  "target_grade": "12",
  "target_stream": "Scientific",
  "subject_focus": "Math",
  "grades_studied_abroad": ["9", "10", "11"],
  "last_completed_grade_abroad": "11",
  "overall_difficulty": 6.0,
  "math_difficulty": 7.0,
  "reading_difficulty": 4.0,
  "notes": "Returning student preparing for Syrian scientific stream.",
  "raw_input_json": {
    "capture_source": "frontend-form"
  },
  "source_type": "manual_test",
  "created_by_user_id": null,
  "status": "active"
}
```

### `POST /analyze-student-case`

```json
{
  "case_id": "SC_DEMO_001",
  "origin_country": "Turkey",
  "grades_studied_abroad": ["9", "10", "11"],
  "last_completed_grade_abroad": "11",
  "target_country": "Syria",
  "target_grade": "12",
  "target_stream": "Scientific",
  "subject_focus": "Math",
  "overall_difficulty": 6.0,
  "math_difficulty": 7.0,
  "notes": "Returning student preparing for Syrian scientific stream mathematics.",
  "extra_fields": {
    "teacher_name": "Demo Teacher"
  }
}
```

### `POST /student-graph`

```json
{
  "case_id": "SC_DEMO_001",
  "origin_country": "Turkey",
  "grades_studied_abroad": ["9", "10", "11"],
  "last_completed_grade_abroad": "11",
  "target_country": "Syria",
  "target_grade": "12",
  "target_stream": "Scientific",
  "subject_focus": "Math",
  "overall_difficulty": 6.0,
  "math_difficulty": 7.0,
  "notes": "Graph preview request.",
  "extra_fields": {}
}
```

### `POST /curriculum-graph`

```json
{
  "country": "Syria",
  "grade": "12",
  "stream": "Scientific",
  "subject": "Math",
  "core_only": true
}
```

### `POST /curriculum/import`

```json
{
  "source_type": "google_sheet",
  "source_uri": null,
  "import_topics": true,
  "import_edges": true,
  "import_student_cases": true
}
```

## Example Response Shapes

The examples below match the current Pydantic response models. Some analysis payload internals are flexible because the response schema uses generic dictionaries.

### `POST /schools` -> `SchoolRead`

```json
{
  "id": 1,
  "name": "Damascus Pilot School",
  "code": "DPS-001",
  "type": "public",
  "country": "Syria",
  "city": "Damascus",
  "region": "Damascus",
  "address": "Al Malki",
  "status": "active",
  "created_at": "2026-05-25T12:00:00Z",
  "updated_at": "2026-05-25T12:00:00Z"
}
```

### `POST /students` -> `StudentRead`

```json
{
  "id": 1,
  "school_id": 1,
  "student_number": "2026-0001",
  "first_name": "Ahmad",
  "father_name": "Khaled",
  "mother_name": "Rana",
  "last_name": "Ali",
  "full_name": "Ahmad Khaled Ali",
  "date_of_birth": "2008-04-12",
  "gender": "male",
  "nationality": "Syrian",
  "current_grade": "12",
  "current_stream": "Scientific",
  "current_section_id": null,
  "status": "active",
  "created_at": "2026-05-25T12:01:00Z",
  "updated_at": "2026-05-25T12:01:00Z"
}
```

### `POST /student-cases` -> `StudentCaseRead`

```json
{
  "id": 1,
  "student_id": 1,
  "school_id": 1,
  "case_code": "SC_DEMO_001",
  "origin_country": "Turkey",
  "target_country": "Syria",
  "target_grade": "12",
  "target_stream": "Scientific",
  "subject_focus": "Math",
  "grades_studied_abroad": ["9", "10", "11"],
  "last_completed_grade_abroad": "11",
  "overall_difficulty": 6.0,
  "math_difficulty": 7.0,
  "reading_difficulty": 4.0,
  "notes": "Returning student preparing for Syrian scientific stream.",
  "raw_input_json": {
    "capture_source": "frontend-form"
  },
  "source_type": "manual_test",
  "created_by_user_id": null,
  "status": "active",
  "created_at": "2026-05-25T12:02:00Z",
  "updated_at": "2026-05-25T12:02:00Z"
}
```

### `POST /analyze-student-case` -> `AnalysisResponse`

```json
{
  "summary": {
    "target_country": "Syria",
    "target_grade": "12",
    "subject_focus": "Math",
    "analysis_run_id": 5
  },
  "teacher_alert_report": [
    {
      "topic_id": "SYR-MATH-11-ALG-01",
      "status_label": "Likely missed due to curriculum switch"
    }
  ],
  "support_first_topics": [
    {
      "from_topic_id": "SYR-MATH-11-ALG-01",
      "coverage_status": "likely_missed_due_to_switch",
      "supported_targets": "Helps with Grade 12 algebra prerequisites"
    }
  ],
  "graph_summary": {
    "nodes_count": 12,
    "edges_count": 14,
    "preview_nodes": [],
    "preview_edges": []
  }
}
```

### `POST /student-graph` or `POST /curriculum-graph` -> `GraphResponse`

```json
{
  "nodes": [
    {
      "id": "SYR-MATH-11-ALG-01",
      "label": "Linear Functions",
      "group": "Algebra",
      "type": "prereq_topic",
      "status": "likely_missed_due_to_switch"
    }
  ],
  "edges": [
    {
      "source": "SYR-MATH-11-ALG-01",
      "target": "SYR-MATH-12-ALG-02",
      "type": "prerequisite",
      "strength": "required",
      "status": "likely_missed_due_to_switch"
    }
  ]
}
```

### `POST /curriculum/import` -> `CurriculumImportResponse`

```json
{
  "batch_id": 3,
  "status": "completed",
  "summary": {
    "topics_upserted": 120,
    "edges_upserted": 180,
    "student_cases_upserted": 10,
    "edges_skipped_missing_topics": 0,
    "batch_id": 3
  }
}
```

## Error Handling Notes

### Common status codes

- `200 OK`: successful reads and updates.
- `404 Not Found`: used by item lookups such as `/schools/{school_id}`, `/students/{student_id}`, `/student-cases/{case_id}`, and `/analysis-runs/{run_id}`.
- `422 Unprocessable Entity`: request body or query validation failed.
- `503 Service Unavailable`: returned by rule-engine endpoints when source data cannot be loaded, and by `/db/seed-roles` if database setup is unavailable at runtime.

### Important integration behaviors

- CRUD endpoints do not wrap repository exceptions into custom API envelopes. Frontends should expect FastAPI's default error format:

```json
{
  "detail": "School not found"
}
```

- Validation errors use FastAPI's standard `detail` array response.
- If `DATABASE_URL` is missing, database-backed routes can fail before controller logic completes because `get_db()` raises at dependency time.
- If `KGDS_DATA_SOURCE=sheets`, the analysis endpoints depend on Google Sheet / CSV availability.
- If `KGDS_DATA_SOURCE=postgres` and `KGDS_DB_REQUIRED=true`, analysis endpoints will not fall back to sheets on DB-loading failure.

## Current Limitations and Placeholders

- No authentication or authorization is enforced at the API layer yet.
- No delete endpoints exist for schools, students, or student cases.
- The analysis response models are intentionally loose; frontend code should tolerate additional keys in nested objects.
- `/curriculum/import` is a bridge from prototype sheet/CSV data into PostgreSQL, not a general ETL framework.
- `/db/seed-roles` changes data and is better treated as an admin-only action.
- Persisted analysis records appear only when `KGDS_PERSIST_ANALYSIS=true` and the database is configured.
- `POST /analyze-student-case` is not currently wired to a persisted `student_cases` row automatically unless persistence is enabled; it can operate as a standalone analysis call.
- `app.models` currently holds the analysis/graph request-response models, while `app.schemas` holds PostgreSQL-backed API schemas. Frontend generators should account for both sources in the OpenAPI output.

## OpenAPI Export

If `docs/openapi.json` is not present yet, generate it manually later:

```powershell
cd backend
uvicorn app.main:app --reload --port 8080
```

Then fetch:

```text
http://127.0.0.1:8080/openapi.json
```
