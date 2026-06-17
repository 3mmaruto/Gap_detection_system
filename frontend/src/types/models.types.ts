/**
 * Domain models — mirror the backend ERD.
 * `erasableSyntaxOnly` is on, so no `enum`s: roles/unions are `as const`.
 */

export const ROLES = ["student", "teacher", "admin"] as const;
export type Role = (typeof ROLES)[number];

export type ID = number;
export type ISODateString = string;

/** Base `User` row. The role-specific tables extend this. */
export interface User {
    id: ID;
    first_name: string;
    last_name: string;
    brith_date: ISODateString | null;
    added_by: ID | null;
    created_timestamp: ISODateString;
    phone: string | null;
    last_login_at: ISODateString | null;
    updated_at: ISODateString | null;
    gender: string | null;
    nationality: string | null;
    /** Derived server-side from which role table the id appears in. */
    role: Role;
}

export interface Student extends User {
    role: "student";
    parent_phone: string | null;
    father_name: string | null;
    mother_name: string | null;
}

export interface Teacher extends User {
    role: "teacher";
}

export interface Admin extends User {
    role: "admin";
}

export type AnyUser = Student | Teacher | Admin;

export interface StudentAcademicHistory {
    student_id: ID;
    grade_level: string;
    country: string | null;
    school_name: string | null;
    gpa: number | null;
}

export interface Subject {
    id: ID;
    learning_path: string | null;
    name: string;
    name_ar: string | null;
}

export interface Topic {
    id: ID;
    subject_id: ID;
}

export interface Level {
    id: ID;
    grade_level: string;
    curriculum_year: string;
}

export interface StudentLevel {
    student_id: ID;
    level_id: ID;
    success_status: string;
}

export interface StudentCurrentLevel {
    student_id: ID;
    level_id: ID;
    success_status: string;
    level: Level;
}

export interface SubjectLevel {
    subject_id: ID;
    level_id: ID;
}

export interface TeacherSubject {
    teacher_id: ID;
    subject_id: ID;
    assigned_at: ISODateString;
}

export interface TeacherStudentTopicFlag {
    teacher_id: ID;
    student_id: ID;
    topic_id: ID;
    risk_level: string;
    notes: string | null;
}

export interface PartGrade {
    id: ID;
    student_id: ID;
    assigned_by: ID;
    subject_id: ID;
    subject?: { id: ID; name: string; name_ar: string | null };
    assignedBy?: { id: ID; first_name: string; last_name: string };
    max_grade: number;
    value: number;
    label: string | null;
    assigned_at: ISODateString;
    updated_at: ISODateString | null;
}

export interface ScheduleItem {
    id: ID;
    subject_id: ID;
    assigned_by: ID;
}

export interface SyllabusItem {
    id: ID;
    schedule_item_id: ID;
    topic_id: ID;
    assigned_by: ID;
}

export const POST_TYPES = ["ANNOUNCEMENT", "CURRICULUM_POST", "HOMEWORK"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABELS: Record<PostType, string> = {
    ANNOUNCEMENT: "Announcement",
    CURRICULUM_POST: "Curriculum",
    HOMEWORK: "Homework",
};

export interface Post {
    id: ID;
    subject_id: ID | null;
    user_id: ID;
    title: string;
    type: PostType;
    content: string | null;
    thumbnail_url: string | null;
    author_alias: string | null;
    created_at: ISODateString;
    updated_at: ISODateString;
    author?: { id: ID; first_name: string; last_name: string };
    subject?: { id: ID; name: string } | null;
    attachments?: PostAttachment[];
}

export interface PostAttachment {
    id: ID;
    post_id: ID;
    url: string;
    filename: string | null;
}

export type NotificationType = "message" | "grade" | "post" | "system";

export interface Notification {
    id: ID;
    user_id: ID;
    type: NotificationType;
    seen: boolean;
    text: string;
    timestamp: ISODateString;
}

export interface ConversationUser {
    id: ID;
    first_name: string;
    last_name: string;
}

export interface Message {
    id: ID;
    conversation_id: ID;
    sender_id: ID;
    text: string;
    timestamp: ISODateString;
}

export interface Conversation {
    id: ID;
    party1: ID;
    party2: ID;
    user1?: ConversationUser;
    user2?: ConversationUser;
    /** Last message only — backend returns take:1 desc */
    messages?: Message[];
}
