"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    analysis,
    analysis_runs,
    auth,
    curriculum,
    db_health,
    graphs,
    health,
    partner_portal,
    recommendations,
    schools,
    student_cases,
    students,
    users,
)

app = FastAPI(
    title="Gap Detection System API",
    description="Detects likely curriculum prerequisite gaps and returns graph-ready outputs.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(db_health.router)
app.include_router(schools.router)
app.include_router(students.router)
app.include_router(student_cases.router)
app.include_router(users.router)
app.include_router(curriculum.router)
app.include_router(analysis_runs.router)
app.include_router(recommendations.router)
app.include_router(analysis.router)
app.include_router(graphs.router)
app.include_router(partner_portal.router)
