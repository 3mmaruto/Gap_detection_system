"""Compatibility API for the partner student/teacher React portal.

The partner UI was built against a NestJS API under /api/*.
These routes keep that frontend mostly intact while using the KGDS FastAPI
backend and PostgreSQL schema as the single source of truth.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.db.models import (
    AcademicYear,
    ClassSection,
    Conversation,
    Message,
    Notification,
    PartGrade,
    Post,
    Role,
    ScheduleItem,
    School,
    Student,
    StudentEducationPath,
    Subject,
    SyllabusItem,
    TeacherAssignment,
    User,
    UserRole,
)
from app.db.session import get_db
from app.repositories.users import assign_role, get_or_create_demo_school, get_role_by_name, get_user_by_email, user_roles
from app.routes.auth import get_current_user
from app.services.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api", tags=["partner-portal"])


class PartnerLoginRequest(BaseModel):
    id: str
    password: str


class PartnerUserCreate(BaseModel):
    first_name: str
    last_name: str
    password: str
    role: str = "student"
    phone: str | None = None
    gender: str | None = None
    nationality: str | None = None
    brith_date: date | None = None
    parent_phone: str | None = None
    father_name: str | None = None
    mother_name: str | None = None


class PartnerUserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    gender: str | None = None
    nationality: str | None = None
    brith_date: date | None = None
    parent_phone: str | None = None
    father_name: str | None = None
    mother_name: str | None = None


class SubjectAssignmentRequest(BaseModel):
    subject_id: int
    level_id: int


class ScheduleSlotRequest(BaseModel):
    day: str
    period: int
    subject_id: int


class SyllabusRequest(BaseModel):
    topic_title: str
    reference: str | None = None


class PostRequest(BaseModel):
    title: str
    type: str = "ANNOUNCEMENT"
    content: str | None = None
    thumbnail_url: str | None = None
    subject_id: int | None = None


class GradeRequest(BaseModel):
    student_id: int
    subject_id: int
    max_grade: float
    value: float
    label: str | None = None


def _split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _role_for(db: Session, user_id: int) -> str:
    names = [name for name, _school_id, _school_name in user_roles(db, user_id)]
    if "school_admin" in names or "platform_super_admin" in names:
        return "admin"
    if "teacher" in names:
        return "teacher"
    return "student"


def _school_id_for(db: Session, user: User) -> int:
    roles = user_roles(db, user.id)
    for _role_name, school_id, _school_name in roles:
        if school_id is not None:
            return school_id
    return get_or_create_demo_school(db).id


def _student_for_user_or_id(db: Session, user_id_or_student_id: int) -> Student | None:
    student = db.scalar(select(Student).where(Student.user_id == user_id_or_student_id))
    if student is not None:
        return student
    return db.get(Student, user_id_or_student_id)


def _user_payload(db: Session, user: User) -> dict[str, Any]:
    first_name, last_name = _split_name(user.full_name)
    role = _role_for(db, user.id)
    payload: dict[str, Any] = {
        "id": user.id,
        "first_name": first_name,
        "last_name": last_name,
        "brith_date": None,
        "added_by": None,
        "created_timestamp": user.created_at.isoformat(),
        "phone": user.phone,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "gender": None,
        "nationality": None,
        "role": role,
    }
    if role == "student":
        student = db.scalar(select(Student).where(Student.user_id == user.id))
        if student is not None:
            payload.update(
                {
                    "parent_phone": student.mother_phone or student.father_phone,
                    "father_name": student.father_name,
                    "mother_name": student.mother_name,
                    "brith_date": student.date_of_birth.isoformat() if student.date_of_birth else None,
                    "phone": student.student_phone or user.phone,
                }
            )
    return payload


def _student_payload(db: Session, student: Student) -> dict[str, Any]:
    user = db.get(User, student.user_id) if student.user_id else None
    first_name = student.first_name
    last_name = student.last_name
    if not first_name:
        first_name, inferred_last = _split_name(student.full_name)
        last_name = last_name or inferred_last
    return {
        "id": user.id if user else student.id,
        "first_name": first_name or student.full_name,
        "last_name": last_name or "",
        "brith_date": student.date_of_birth.isoformat() if student.date_of_birth else None,
        "added_by": None,
        "created_timestamp": student.created_at.isoformat(),
        "phone": student.student_phone,
        "last_login_at": user.last_login_at.isoformat() if user and user.last_login_at else None,
        "updated_at": student.updated_at.isoformat() if student.updated_at else None,
        "gender": student.gender,
        "nationality": student.nationality,
        "role": "student",
        "parent_phone": student.mother_phone or student.father_phone,
        "father_name": student.father_name,
        "mother_name": student.mother_name,
    }


def _paginate(items: list[dict[str, Any]], page: int = 1, page_size: int = 100) -> dict[str, Any]:
    start = max(page - 1, 0) * page_size
    return {"items": items[start : start + page_size], "total": len(items), "page": page, "page_size": page_size}


@router.post("/auth/v1/login")
def partner_login(payload: PartnerLoginRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    user = get_user_by_email(db, payload.id)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "user": _user_payload(db, user)}


@router.get("/auth/v1/me")
def partner_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    return _user_payload(db, current_user)


@router.post("/auth/v1/logout")
def partner_logout() -> dict[str, str]:
    return {"message": "Logged out"}


@router.get("/users/v1")
def partner_list_users(
    role: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    statement = select(User).order_by(User.id)
    users = list(db.scalars(statement))
    rows = [_user_payload(db, user) for user in users]
    if role:
        role = "admin" if role == "school_admin" else role
        rows = [row for row in rows if row["role"] == role]
    if search:
        needle = search.lower()
        rows = [row for row in rows if needle in f"{row['first_name']} {row['last_name']}".lower()]
    return _paginate(rows, page, page_size)


@router.post("/users/v1")
def partner_create_user(
    payload: PartnerUserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    school_id = _school_id_for(db, current_user)
    role_name = "school_admin" if payload.role == "admin" else payload.role
    role = get_role_by_name(db, role_name)
    if role is None:
        raise HTTPException(status_code=400, detail=f"Unknown role: {payload.role}")
    full_name = f"{payload.first_name} {payload.last_name}".strip()
    username = full_name if payload.role == "student" else payload.first_name.lower()
    if get_user_by_email(db, username):
        username = f"{username}.{payload.last_name.lower()}".strip(".")
    user = User(full_name=full_name, email=username, phone=payload.phone, password_hash=hash_password(payload.password), status="active")
    db.add(user)
    db.flush()
    assign_role(db, user, role, school_id)
    if payload.role == "student":
        student = Student(
            user_id=user.id,
            school_id=school_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            full_name=full_name,
            father_name=payload.father_name,
            mother_name=payload.mother_name,
            date_of_birth=payload.brith_date,
            gender=payload.gender,
            nationality=payload.nationality,
            student_phone=payload.phone,
            mother_phone=payload.parent_phone,
            current_grade="12",
            current_stream="Scientific",
            status="active",
        )
        db.add(student)
    db.commit()
    db.refresh(user)
    return _user_payload(db, user)


@router.get("/users/v1/{user_id}")
def partner_get_user(user_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    user = db.get(User, user_id)
    if user is None:
        student = _student_for_user_or_id(db, user_id)
        if student is None:
            raise HTTPException(status_code=404, detail="User not found")
        return _student_payload(db, student)
    return _user_payload(db, user)


@router.patch("/users/v1/{user_id}")
def partner_update_user(
    user_id: int,
    payload: PartnerUserUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.first_name or payload.last_name:
        first_name, last_name = _split_name(user.full_name)
        user.full_name = f"{payload.first_name or first_name} {payload.last_name or last_name}".strip()
    if payload.phone is not None:
        user.phone = payload.phone
    student = db.scalar(select(Student).where(Student.user_id == user.id))
    if student is not None:
        if payload.father_name is not None:
            student.father_name = payload.father_name
        if payload.mother_name is not None:
            student.mother_name = payload.mother_name
        if payload.parent_phone is not None:
            student.mother_phone = payload.parent_phone
        if payload.brith_date is not None:
            student.date_of_birth = payload.brith_date
    db.commit()
    db.refresh(user)
    return _user_payload(db, user)


@router.get("/students/v1")
def partner_list_students(
    search: str | None = None,
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    statement = select(Student).order_by(Student.id)
    if _role_for(db, current_user.id) == "teacher":
        assigned_section_ids = select(TeacherAssignment.class_section_id).where(
            TeacherAssignment.teacher_user_id == current_user.id,
            TeacherAssignment.status == "active",
        )
        statement = statement.where(Student.current_section_id.in_(assigned_section_ids))
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(or_(Student.full_name.ilike(pattern), Student.father_name.ilike(pattern), Student.mother_name.ilike(pattern)))
    rows = [_student_payload(db, student) for student in db.scalars(statement)]
    return _paginate(rows, page, page_size)


@router.get("/students/v1/{student_id}")
def partner_get_student(student_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    student = _student_for_user_or_id(db, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return _student_payload(db, student)


@router.get("/students/v1/{student_id}/history")
def partner_student_history(student_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    student = _student_for_user_or_id(db, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    paths = db.scalars(select(StudentEducationPath).where(StudentEducationPath.student_id == student.id).order_by(StudentEducationPath.grade))
    return [
        {"student_id": student.user_id or student.id, "grade_level": path.grade, "country": path.country, "school_name": path.school_name, "gpa": None}
        for path in paths
    ]


@router.get("/levels/v1")
def partner_levels(mine: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    statement = select(ClassSection, AcademicYear).join(AcademicYear, AcademicYear.id == ClassSection.academic_year_id).order_by(ClassSection.grade)
    if mine and _role_for(db, current_user.id) == "teacher":
        statement = statement.join(TeacherAssignment, TeacherAssignment.class_section_id == ClassSection.id).where(TeacherAssignment.teacher_user_id == current_user.id)
    return [{"id": section.id, "grade_level": f"Grade {section.grade}", "curriculum_year": year.name} for section, year in db.execute(statement).all()]


@router.get("/subjects/v1")
def partner_subjects(
    level_id: int | None = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    statement = select(Subject).order_by(Subject.id)
    if mine and _role_for(db, current_user.id) == "teacher":
        statement = statement.join(TeacherAssignment, TeacherAssignment.subject_id == Subject.id).where(TeacherAssignment.teacher_user_id == current_user.id)
        if level_id is not None:
            statement = statement.where(TeacherAssignment.class_section_id == level_id)
    return [{"id": subject.id, "learning_path": None, "name": subject.name_en or subject.code, "name_ar": subject.name_native} for subject in db.scalars(statement).unique()]


@router.get("/subjects/v1/{subject_id}")
def partner_get_subject(subject_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"id": subject.id, "learning_path": None, "name": subject.name_en or subject.code, "name_ar": subject.name_native}


@router.get("/users/v1/{teacher_id}/subjects")
def partner_teacher_subjects(teacher_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    return _teacher_subject_rows(db, teacher_id)


@router.post("/users/v1/{teacher_id}/subjects")
def partner_add_teacher_subject(
    teacher_id: int,
    payload: SubjectAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    section = db.get(ClassSection, payload.level_id)
    if section is None:
        raise HTTPException(status_code=404, detail="Level not found")
    existing = db.scalar(
        select(TeacherAssignment).where(
            TeacherAssignment.teacher_user_id == teacher_id,
            TeacherAssignment.class_section_id == payload.level_id,
            TeacherAssignment.subject_id == payload.subject_id,
        )
    )
    if existing is None:
        db.add(
            TeacherAssignment(
                teacher_user_id=teacher_id,
                school_id=section.school_id,
                class_section_id=section.id,
                subject_id=payload.subject_id,
                academic_year_id=section.academic_year_id,
                status="active",
            )
        )
        db.commit()
    return _teacher_subject_rows(db, teacher_id)


@router.delete("/users/v1/{teacher_id}/subjects")
def partner_remove_teacher_subject(
    teacher_id: int,
    subject_id: int,
    level_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    assignment = db.scalar(
        select(TeacherAssignment).where(
            TeacherAssignment.teacher_user_id == teacher_id,
            TeacherAssignment.class_section_id == level_id,
            TeacherAssignment.subject_id == subject_id,
        )
    )
    if assignment is not None:
        db.delete(assignment)
        db.commit()
    return _teacher_subject_rows(db, teacher_id)


def _teacher_subject_rows(db: Session, teacher_id: int) -> list[dict[str, Any]]:
    rows = db.execute(
        select(TeacherAssignment, Subject, ClassSection, AcademicYear)
        .join(Subject, Subject.id == TeacherAssignment.subject_id)
        .join(ClassSection, ClassSection.id == TeacherAssignment.class_section_id)
        .join(AcademicYear, AcademicYear.id == TeacherAssignment.academic_year_id)
        .where(TeacherAssignment.teacher_user_id == teacher_id)
        .order_by(ClassSection.grade, Subject.id)
    ).all()
    return [
        {
            "subject_id": subject.id,
            "subject_name": subject.name_en or subject.code,
            "subject_name_ar": subject.name_native,
            "level_id": section.id,
            "grade_level": f"Grade {section.grade}",
            "curriculum_year": year.name,
            "assigned_at": assignment.id,
        }
        for assignment, subject, section, year in rows
    ]


@router.get("/schedule/v1")
def partner_schedule(subject_id: int | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    school_id = _school_id_for(db, current_user)
    statement = select(ScheduleItem, Subject).join(Subject, Subject.id == ScheduleItem.subject_id).where(ScheduleItem.school_id == school_id)
    if subject_id is not None:
        statement = statement.where(ScheduleItem.subject_id == subject_id)
    entries = []
    for item, subject in db.execute(statement.order_by(ScheduleItem.day, ScheduleItem.period)).all():
        latest = db.scalar(select(SyllabusItem).where(SyllabusItem.schedule_item_id == item.id).order_by(SyllabusItem.id.desc()))
        entries.append(
            {
                "schedule_item_id": item.id,
                "subject_id": subject.id,
                "subject_name": subject.name_en or subject.code,
                "topic_title": latest.topic_title if latest else "Lesson plan pending",
                "reference": latest.reference if latest else None,
                "day": item.day,
                "period": item.period,
            }
        )
    return {"range_label": "Current academic week", "week_start": date.today().isoformat(), "entries": entries}


@router.put("/schedule/v1/slot")
def partner_upsert_schedule_slot(payload: ScheduleSlotRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, str]:
    school_id = _school_id_for(db, current_user)
    item = db.scalar(select(ScheduleItem).where(ScheduleItem.school_id == school_id, ScheduleItem.day == payload.day, ScheduleItem.period == payload.period))
    if item is None:
        item = ScheduleItem(school_id=school_id, day=payload.day, period=payload.period, subject_id=payload.subject_id, assigned_by=current_user.id)
        db.add(item)
    else:
        item.subject_id = payload.subject_id
        item.assigned_by = current_user.id
    db.commit()
    return {"status": "ok"}


@router.delete("/schedule/v1/slot")
def partner_delete_schedule_slot(day: str, period: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, str]:
    school_id = _school_id_for(db, current_user)
    item = db.scalar(select(ScheduleItem).where(ScheduleItem.school_id == school_id, ScheduleItem.day == day, ScheduleItem.period == period))
    if item is not None:
        db.delete(item)
        db.commit()
    return {"status": "ok"}


@router.get("/schedule/v1/{schedule_item_id}/syllabus")
def partner_syllabus(schedule_item_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    items = db.scalars(select(SyllabusItem).where(SyllabusItem.schedule_item_id == schedule_item_id).order_by(SyllabusItem.id))
    return [{"id": item.id, "schedule_item_id": item.schedule_item_id, "topic_id": item.topic_id, "topic_title": item.topic_title, "reference": item.reference} for item in items]


@router.post("/schedule/v1/{schedule_item_id}/syllabus")
def partner_add_syllabus(schedule_item_id: int, payload: SyllabusRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    item = SyllabusItem(schedule_item_id=schedule_item_id, topic_title=payload.topic_title, reference=payload.reference, assigned_by=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "schedule_item_id": item.schedule_item_id, "topic_id": item.topic_id, "topic_title": item.topic_title, "reference": item.reference}


@router.get("/posts/v1")
def partner_posts(
    subject_id: int | None = None,
    type: str | None = None,
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    statement = select(Post).order_by(Post.id.desc())
    if subject_id is not None:
        statement = statement.where(Post.subject_id == subject_id)
    if type is not None:
        statement = statement.where(Post.type == type)
    rows = [_post_payload(db, post) for post in db.scalars(statement)]
    return _paginate(rows, page, page_size)


@router.post("/posts/v1")
def partner_create_post(payload: PostRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    post = Post(
        school_id=_school_id_for(db, current_user),
        subject_id=payload.subject_id,
        user_id=current_user.id,
        title=payload.title,
        type=payload.type,
        content=payload.content,
        thumbnail_url=payload.thumbnail_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_payload(db, post)


@router.get("/posts/v1/{post_id}")
def partner_get_post(post_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return _post_payload(db, post)


@router.patch("/posts/v1/{post_id}")
def partner_update_post(post_id: int, payload: PostRequest, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    post.title = payload.title
    post.type = payload.type
    post.content = payload.content
    post.thumbnail_url = payload.thumbnail_url
    post.subject_id = payload.subject_id
    db.commit()
    db.refresh(post)
    return _post_payload(db, post)


@router.delete("/posts/v1/{post_id}")
def partner_delete_post(post_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, str]:
    post = db.get(Post, post_id)
    if post is not None:
        db.delete(post)
        db.commit()
    return {"status": "ok"}


def _post_payload(db: Session, post: Post) -> dict[str, Any]:
    author = db.get(User, post.user_id)
    subject = db.get(Subject, post.subject_id) if post.subject_id else None
    return {
        "id": post.id,
        "subject_id": post.subject_id,
        "user_id": post.user_id,
        "title": post.title,
        "type": post.type,
        "content": post.content,
        "thumbnail_url": post.thumbnail_url,
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat(),
        "author": {"id": author.id, "first_name": _split_name(author.full_name)[0], "last_name": _split_name(author.full_name)[1]} if author else None,
        "subject": {"id": subject.id, "name": subject.name_en or subject.code} if subject else None,
        "attachments": [],
    }


@router.get("/students/v1/{student_id}/progress")
def partner_progress(student_id: int, subject_id: int | None = None, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, float]:
    student = _student_for_user_or_id(db, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    grades = list(db.scalars(select(PartGrade).where(PartGrade.student_id == student.id)))
    if not grades:
        return {"percent": 0}
    percent = sum(min(grade.value / grade.max_grade, 1.0) for grade in grades if grade.max_grade) / len(grades) * 100
    return {"percent": round(percent, 1)}


@router.get("/grades/v1")
def partner_grades(student_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    student = _student_for_user_or_id(db, student_id)
    if student is None:
        return []
    grades = db.scalars(select(PartGrade).where(PartGrade.student_id == student.id).order_by(PartGrade.id.desc()))
    return [_grade_payload(db, grade) for grade in grades]


@router.post("/grades/v1")
def partner_create_grade(payload: GradeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    student = _student_for_user_or_id(db, payload.student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    grade = PartGrade(student_id=student.id, assigned_by=current_user.id, subject_id=payload.subject_id, max_grade=payload.max_grade, value=payload.value, label=payload.label)
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return _grade_payload(db, grade)


@router.patch("/grades/v1/{grade_id}")
def partner_update_grade(grade_id: int, payload: GradeRequest, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    grade = db.get(PartGrade, grade_id)
    if grade is None:
        raise HTTPException(status_code=404, detail="Grade not found")
    grade.subject_id = payload.subject_id
    grade.max_grade = payload.max_grade
    grade.value = payload.value
    grade.label = payload.label
    db.commit()
    db.refresh(grade)
    return _grade_payload(db, grade)


@router.delete("/grades/v1/{grade_id}")
def partner_delete_grade(grade_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, str]:
    grade = db.get(PartGrade, grade_id)
    if grade is not None:
        db.delete(grade)
        db.commit()
    return {"status": "ok"}


def _grade_payload(db: Session, grade: PartGrade) -> dict[str, Any]:
    subject = db.get(Subject, grade.subject_id)
    return {
        "id": grade.id,
        "student_id": grade.student_id,
        "assigned_by": grade.assigned_by,
        "subject_id": grade.subject_id,
        "subject": {"id": subject.id, "name": subject.name_en or subject.code} if subject else None,
        "max_grade": grade.max_grade,
        "value": grade.value,
        "label": grade.label,
        "assigned_at": grade.assigned_at.isoformat(),
        "updated_at": grade.updated_at.isoformat() if grade.updated_at else None,
    }


@router.get("/notifications/v1")
def partner_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    notifications = db.scalars(select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.id.desc()))
    return [
        {"id": item.id, "user_id": item.user_id, "type": item.type.lower(), "seen": item.seen, "text": item.text, "timestamp": item.timestamp.isoformat()}
        for item in notifications
    ]


@router.patch("/notifications/v1/{notification_id}/seen")
def partner_mark_seen(notification_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> dict[str, str]:
    item = db.get(Notification, notification_id)
    if item is not None:
        item.seen = True
        db.commit()
    return {"status": "ok"}


@router.patch("/notifications/v1/mark-all-seen")
def partner_mark_all_seen(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, str]:
    for item in db.scalars(select(Notification).where(Notification.user_id == current_user.id, Notification.seen.is_(False))):
        item.seen = True
    db.commit()
    return {"status": "ok"}


@router.get("/conversations/v1")
def partner_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    rows = db.scalars(select(Conversation).where(or_(Conversation.party1 == current_user.id, Conversation.party2 == current_user.id)).order_by(Conversation.id.desc()))
    return [{"id": row.id, "party1": row.party1, "party2": row.party2} for row in rows]


@router.get("/conversations/v1/{conversation_id}/messages")
def partner_messages(conversation_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    rows = db.scalars(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.id))
    return [{"id": row.id, "conversation_id": row.conversation_id, "sender_id": row.sender_id, "text": row.text, "timestamp": row.timestamp.isoformat()} for row in rows]


@router.post("/conversations/v1/{conversation_id}/messages")
def partner_add_message(conversation_id: int, payload: dict[str, str], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    message = Message(conversation_id=conversation_id, sender_id=current_user.id, text=payload.get("text", ""))
    db.add(message)
    db.commit()
    db.refresh(message)
    return {"id": message.id, "conversation_id": message.conversation_id, "sender_id": message.sender_id, "text": message.text, "timestamp": message.timestamp.isoformat()}
