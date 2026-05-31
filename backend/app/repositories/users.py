"""User and local MVP account persistence operations."""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
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
from app.schemas.db import UserCreate
from app.services.auth import hash_password


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_role_by_name(db: Session, name: str) -> Role | None:
    return db.scalar(select(Role).where(Role.name == name))


def get_or_create_demo_school(db: Session) -> School:
    school = db.scalar(select(School).where(School.code == "DRS-DEMO"))
    if school is None:
        school = School(
            name="Damascus Reintegration School",
            code="DRS-DEMO",
            type="demo",
            country="Syria",
            city="Damascus",
            status="active",
        )
        db.add(school)
        db.flush()
    return school


def assign_role(db: Session, user: User, role: Role, school_id: int | None = None) -> None:
    existing = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
            UserRole.school_id == school_id,
        )
    )
    if existing is None:
        db.add(UserRole(user_id=user.id, role_id=role.id, school_id=school_id))


def create_user(db: Session, payload: UserCreate) -> User:
    role = get_role_by_name(db, payload.role)
    if role is None:
        raise ValueError(f"Unknown role: {payload.role}")
    existing = get_user_by_email(db, payload.email)
    if existing is not None:
        raise ValueError("User already exists")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        status=payload.status,
    )
    db.add(user)
    db.flush()
    assign_role(db, user, role, payload.school_id)
    db.commit()
    db.refresh(user)
    return user


def bootstrap_demo_admin(db: Session) -> tuple[School, User]:
    school = get_or_create_demo_school(db)
    role = get_role_by_name(db, "school_admin")
    if role is None:
        raise ValueError("school_admin role has not been seeded")
    user = get_user_by_email(db, "admin")
    if user is None:
        user = User(
            full_name="Lina Haddad",
            email="admin",
            password_hash=hash_password("admin"),
            status="active",
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = user.full_name or "Lina Haddad"
        user.password_hash = hash_password("admin")
        user.status = "active"
    assign_role(db, user, role, school.id)
    _bootstrap_student_teacher_portal_demo(db, school, user)
    db.commit()
    db.refresh(school)
    db.refresh(user)
    return school, user


def _get_or_create_user(db: Session, username: str, full_name: str, password: str, role_name: str, school_id: int) -> User:
    role = get_role_by_name(db, role_name)
    if role is None:
        raise ValueError(f"{role_name} role has not been seeded")
    user = get_user_by_email(db, username)
    if user is None:
        user = User(full_name=full_name, email=username, password_hash=hash_password(password), status="active")
        db.add(user)
        db.flush()
    else:
        user.full_name = full_name
        user.password_hash = hash_password(password)
        user.status = "active"
    assign_role(db, user, role, school_id)
    return user


def _bootstrap_student_teacher_portal_demo(db: Session, school: School, admin_user: User) -> None:
    teacher = _get_or_create_user(db, "teacher", "Omar Khaled", "teacher", "teacher", school.id)
    student_user = _get_or_create_user(db, "Sami Al-Hassan", "Sami Al-Hassan", "student", "student", school.id)

    subject = db.scalar(select(Subject).where(Subject.code == "Math"))
    if subject is None:
        subject = Subject(code="Math", name_en="Math", name_native="Mathematics")
        db.add(subject)
        db.flush()

    academic_year = db.scalar(select(AcademicYear).where(AcademicYear.school_id == school.id, AcademicYear.name == "2025-2026"))
    if academic_year is None:
        academic_year = AcademicYear(school_id=school.id, name="2025-2026", is_active=True)
        db.add(academic_year)
        db.flush()

    section = db.scalar(
        select(ClassSection).where(
            ClassSection.school_id == school.id,
            ClassSection.academic_year_id == academic_year.id,
            ClassSection.grade == "12",
            ClassSection.stream == "Scientific",
            ClassSection.section_name == "A",
        )
    )
    if section is None:
        section = ClassSection(
            school_id=school.id,
            academic_year_id=academic_year.id,
            grade="12",
            stream="Scientific",
            section_name="A",
            homeroom_teacher_id=teacher.id,
            status="active",
        )
        db.add(section)
        db.flush()

    student = db.scalar(select(Student).where(Student.full_name == "Sami Al-Hassan", Student.school_id == school.id))
    if student is None:
        student = Student(
            school_id=school.id,
            user_id=student_user.id,
            first_name="Sami",
            last_name="Al-Hassan",
            full_name="Sami Al-Hassan",
            father_name="Mahmoud Al-Hassan",
            mother_name="Rana Al-Hassan",
            date_of_birth=date(2008, 4, 12),
            current_grade="12",
            current_stream="Scientific",
            student_phone="0991000001",
            mother_phone="0991000002",
            father_phone="0991000003",
            current_section_id=section.id,
            status="active",
        )
        db.add(student)
        db.flush()
    else:
        student.user_id = student_user.id
        student.first_name = student.first_name or "Sami"
        student.last_name = student.last_name or "Al-Hassan"
        student.father_name = student.father_name or "Mahmoud Al-Hassan"
        student.mother_name = student.mother_name or "Rana Al-Hassan"
        student.date_of_birth = student.date_of_birth or date(2008, 4, 12)
        student.current_grade = student.current_grade or "12"
        student.current_stream = student.current_stream or "Scientific"
        student.student_phone = student.student_phone or "0991000001"
        student.mother_phone = student.mother_phone or "0991000002"
        student.father_phone = student.father_phone or "0991000003"
        student.current_section_id = student.current_section_id or section.id
        student.status = "active"

    for grade, country, school_name in [("9", "Turkey", "Istanbul Bridge School"), ("10", "Turkey", "Istanbul Bridge School"), ("11", "Turkey", "Istanbul Bridge School")]:
        path = db.scalar(select(StudentEducationPath).where(StudentEducationPath.student_id == student.id, StudentEducationPath.grade == grade))
        if path is None:
            db.add(
                StudentEducationPath(
                    student_id=student.id,
                    grade=grade,
                    country=country,
                    stream="Scientific",
                    school_name=school_name,
                    completed_status="completed",
                    evidence_type="report_card",
                    source_confidence=0.7,
                )
            )

    assignment = db.scalar(
        select(TeacherAssignment).where(
            TeacherAssignment.teacher_user_id == teacher.id,
            TeacherAssignment.school_id == school.id,
            TeacherAssignment.class_section_id == section.id,
            TeacherAssignment.subject_id == subject.id,
        )
    )
    if assignment is None:
        db.add(
            TeacherAssignment(
                teacher_user_id=teacher.id,
                school_id=school.id,
                class_section_id=section.id,
                subject_id=subject.id,
                academic_year_id=academic_year.id,
                status="active",
            )
        )

    for title, post_type, content in [
        ("Welcome to Grade 12 Scientific Math", "ANNOUNCEMENT", "This workspace connects schedule, lessons, progress, and support actions."),
        ("Algebra review pack", "CURRICULUM_POST", "Review functions, limits, and prerequisite algebra concepts before the next lesson."),
        ("Homework: prerequisite practice", "HOMEWORK", "Complete the bridge exercises for missed prerequisite topics."),
    ]:
        exists = db.scalar(select(Post).where(Post.school_id == school.id, Post.title == title))
        if exists is None:
            db.add(Post(school_id=school.id, subject_id=subject.id, user_id=teacher.id, title=title, type=post_type, content=content))

    for day, period, topic in [("SUN", 1, "Functions review"), ("MON", 2, "Limits and continuity"), ("TUE", 3, "Derivative foundations")]:
        item = db.scalar(select(ScheduleItem).where(ScheduleItem.school_id == school.id, ScheduleItem.day == day, ScheduleItem.period == period))
        if item is None:
            item = ScheduleItem(school_id=school.id, subject_id=subject.id, assigned_by=teacher.id, day=day, period=period, level_id=section.id)
            db.add(item)
            db.flush()
        syllabus = db.scalar(select(SyllabusItem).where(SyllabusItem.schedule_item_id == item.id, SyllabusItem.topic_title == topic))
        if syllabus is None:
            db.add(SyllabusItem(schedule_item_id=item.id, assigned_by=teacher.id, topic_title=topic, reference="KGDS bridge"))

    grade = db.scalar(select(PartGrade).where(PartGrade.student_id == student.id, PartGrade.subject_id == subject.id, PartGrade.label == "Bridge quiz"))
    if grade is None:
        db.add(PartGrade(student_id=student.id, assigned_by=teacher.id, subject_id=subject.id, max_grade=100, value=72, label="Bridge quiz"))

    for target_user, text in [(teacher, "Sami Al-Hassan needs review after the latest gap analysis."), (student_user, "Your Math bridge support plan is ready.")]:
        notice = db.scalar(select(Notification).where(Notification.user_id == target_user.id, Notification.text == text))
        if notice is None:
            db.add(Notification(user_id=target_user.id, type="SYSTEM", text=text))

    conversation = db.scalar(select(Conversation).where(Conversation.party1 == teacher.id, Conversation.party2 == student_user.id))
    if conversation is None:
        conversation = Conversation(party1=teacher.id, party2=student_user.id)
        db.add(conversation)
        db.flush()
    message = db.scalar(select(Message).where(Message.conversation_id == conversation.id))
    if message is None:
        db.add(Message(conversation_id=conversation.id, sender_id=teacher.id, text="Please review the bridge exercises before our next session."))


def list_users(db: Session, role_name: str | None = None, school_id: int | None = None) -> list[User]:
    statement = select(User).order_by(User.id)
    if role_name or school_id is not None:
        statement = statement.join(UserRole, UserRole.user_id == User.id)
    if role_name:
        statement = statement.join(Role, Role.id == UserRole.role_id).where(Role.name == role_name)
    if school_id is not None:
        statement = statement.where(UserRole.school_id == school_id)
    return list(db.scalars(statement).unique())


def user_roles(db: Session, user_id: int) -> list[tuple[str, int | None, str | None]]:
    rows = db.execute(
        select(Role.name, UserRole.school_id, School.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .outerjoin(School, School.id == UserRole.school_id)
        .where(UserRole.user_id == user_id)
        .order_by(Role.name)
    ).all()
    return [(role_name, school_id, school_name) for role_name, school_id, school_name in rows]
