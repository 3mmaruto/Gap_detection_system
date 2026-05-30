import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Layers3,
  Lock,
  Network,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { Badge, Card, EmptyState, MetricCard, SectionHeader } from "./components/common/UI";
import { GraphMock } from "./components/graph/GraphMock";
import { KnowledgeGraphCanvas } from "./components/graph/KnowledgeGraphCanvas";
import { analysisStats, permissions, roleMatrix, school, studentCase, students, supportTopics, teacherActions } from "./data/mockData";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { api } from "./services/api";
import type { AnalysisResponse, ApiStudent, GraphResponse, Student, StudentProfile } from "./types";

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return pathname;
}

function apiStudentToStudent(student: ApiStudent): Student {
  return {
    id: student.id,
    name: student.full_name,
    grade: student.current_grade || "-",
    section: "-",
    stream: student.current_stream || "-",
    originCountry: "-",
    status: student.status,
    priority: "Active",
  };
}

function getStoredAnalysis(): AnalysisResponse | null {
  const raw = localStorage.getItem("kgds_latest_analysis");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResponse;
  } catch {
    return null;
  }
}

type PriorEducationRow = {
  grade: string;
  country: string;
  stream: string;
  school_name: string;
  document_type: "pdf" | "image";
  original_filename: string;
  mime_type: string;
};

type RegistrationForm = {
  full_name: string;
  mother_name: string;
  father_name: string;
  date_of_birth: string;
  target_grade: string;
  target_stream: string;
  student_phone: string;
  mother_phone: string;
  father_phone: string;
  studied_outside_syria: boolean;
  studied_country: string;
  other_country: string;
  years_count: number;
  notes: string;
};

type AnalysisPayload = {
  case_id: string;
  origin_country: string;
  grades_studied_abroad: string[];
  last_completed_grade_abroad: string;
  target_country: string;
  target_grade: string;
  target_stream: string;
  subject_focus: string;
  overall_difficulty: number;
  math_difficulty: number;
  notes: string;
  extra_fields: Record<string, unknown>;
};

function buildPriorRows(targetGrade: string, yearsCount: number, defaultCountry: string): PriorEducationRow[] {
  const target = Number.parseInt(targetGrade || "0", 10);
  if (!target || yearsCount < 1) return [];
  return Array.from({ length: Math.min(yearsCount, 11) }, (_item, index) => ({
    grade: String(Math.max(target - index - 1, 1)),
    country: defaultCountry,
    stream: "Scientific",
    school_name: "",
    document_type: "pdf",
    original_filename: "",
    mime_type: "application/pdf",
  }));
}

function summarizeAnalysisPayload(profile: StudentProfile, subjectFocus = "Math"): AnalysisPayload {
  const student = profile.student;
  const abroadPaths = profile.education_paths.filter((path) => path.country.toLowerCase() !== "syria");
  const latestCase = profile.cases[0];
  const abroadGrades = abroadPaths.map((path) => path.grade).sort((a, b) => Number(a) - Number(b));
  const lastCompleted = abroadGrades.length ? abroadGrades[abroadGrades.length - 1] : latestCase?.last_completed_grade_abroad || "";

  return {
    case_id: latestCase?.case_code || `FRONT-${student.id}-${Date.now()}`,
    origin_country: abroadPaths[0]?.country || latestCase?.origin_country || "Syria",
    grades_studied_abroad: abroadGrades,
    last_completed_grade_abroad: lastCompleted,
    target_country: "Syria",
    target_grade: student.current_grade || latestCase?.target_grade || "12",
    target_stream: student.current_stream || latestCase?.target_stream || "Scientific",
    subject_focus: subjectFocus,
    overall_difficulty: latestCase?.overall_difficulty ?? 6,
    math_difficulty: latestCase?.math_difficulty ?? 7,
    notes: latestCase?.notes || "Generated from registered student profile.",
    extra_fields: {
      student_id: student.id,
      student_name: student.full_name,
      father_name: student.father_name,
      mother_name: student.mother_name,
      education_paths: profile.education_paths,
    },
  };
}

function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="hero-graph-card">
        <div className="mini-topline">
          <span />
          Knowledge graph reasoning
        </div>
        <GraphMock />
      </div>
      <div className="hero-report">
        <Badge tone="gold">3 priority prerequisites</Badge>
        <strong>Teacher intervention brief</strong>
        <p>Support-first plan prepared for Grade 12 Scientific Math.</p>
      </div>
    </div>
  );
}

function LandingPage() {
  const modules = ["Student intake", "Gap analysis", "Knowledge graph", "Teacher reports", "Analytics", "Documents"];

  return (
    <PublicLayout>
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Academic Precision for returning students</p>
            <h1>School management with intelligent learning-gap detection</h1>
            <p>
              KGDS helps schools identify prerequisite gaps, guide teacher action, and support students returning from
              different curriculum paths with careful, evidence-aware recommendations.
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => navigate("/register-school")}>
                Request a Demo
                <ArrowRight size={18} />
              </button>
              <button className="secondary-button" type="button" onClick={() => navigate("/dashboard")}>
                Explore Dashboard
              </button>
            </div>
          </div>
          <HeroVisual />
        </section>

        <section className="content-band">
          <SectionHeader
            eyebrow="Problem"
            title="Curriculum switching leaves quiet gaps"
            text="Returnee students may arrive with incomplete records, different topic sequences, or missing prerequisite exposure. KGDS turns that uncertainty into structured support signals."
          />
          <div className="three-column">
            {["Missing documents", "Different sequences", "Teacher time pressure"].map((item) => (
              <Card key={item}>
                <Badge tone="navy">{item}</Badge>
                <p>
                  Schools need a practical way to move from registration facts to a support plan without treating the
                  system output as a final placement decision.
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="split-band">
          <div>
            <SectionHeader
              eyebrow="Solution"
              title="A school workspace, not an isolated algorithm"
              text="The MVP combines onboarding, student cases, graph reasoning, analysis reports, teacher feedback, and analytics in one calm institutional interface."
            />
            <div className="module-grid">
              {modules.map((module) => (
                <button key={module} type="button" onClick={() => navigate("/dashboard")}>
                  <CheckCircle2 size={18} />
                  {module}
                </button>
              ))}
            </div>
          </div>
          <Card className="process-card">
            {["Intake", "Cross-reference", "Gap synthesis", "Teacher action"].map((step, index) => (
              <div key={step} className="process-row">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </Card>
        </section>

        <section className="content-band">
          <SectionHeader eyebrow="Plans" title="Plans placeholder" text="Packaging, billing, and subscription flows are UI placeholders for future product decisions." />
          <div className="three-column">
            {["Pilot school", "District workspace", "Ministry analytics"].map((plan) => (
              <Card key={plan}>
                <h3>{plan}</h3>
                <p>Designed as a planning placeholder until pricing, procurement, and billing rules are finalized.</p>
              </Card>
            ))}
          </div>
        </section>

        <footer className="public-footer">
          <strong>KGDS</strong>
          <span>Transparent learning-gap support for inclusive education.</span>
          <button type="button" onClick={() => navigate("/methodology")}>
            Methodology / transparency
          </button>
        </footer>
      </main>
    </PublicLayout>
  );
}

function AboutPage() {
  return (
    <PublicLayout>
      <main className="narrow-page">
        <SectionHeader
          eyebrow="Mission"
          title="Educational inclusion with human review"
          text="KGDS supports schools receiving students affected by displacement, curriculum switching, and incomplete documentation."
        />
        <div className="stack">
          <Card>
            <h3>Support signals, not final decisions</h3>
            <p>
              Analysis outputs help teachers and administrators prioritize assessment and support. Placement, promotion,
              and intervention decisions remain human responsibilities.
            </p>
          </Card>
          <Card>
            <h3>Built for returnee student workflows</h3>
            <p>
              The MVP focuses on education path capture, prerequisite comparison, teacher-facing reports, and
              privacy-aware dashboard planning.
            </p>
          </Card>
        </div>
      </main>
    </PublicLayout>
  );
}

function MethodologyPage() {
  const items = [
    "Curriculum graph reasoning links target topics to prerequisite topics.",
    "Rule-based detection identifies likely missed, covered, bridge, and current-path topics.",
    "Future ML signals are placeholders and require evidence review before use.",
    "Evidence confidence should combine documents, teacher feedback, and assessment results.",
    "Privacy and human review are core assumptions in every workflow.",
  ];

  return (
    <PublicLayout>
      <main className="narrow-page">
        <SectionHeader eyebrow="Methodology" title="Transparent by design" text="The first MVP favors explainable rules and graph structure before predictive automation." />
        <div className="stack">
          {items.map((item) => (
            <Card key={item}>
              <p>{item}</p>
            </Card>
          ))}
        </div>
      </main>
    </PublicLayout>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <main className="auth-page">
        <Card className="auth-card">
          <SectionHeader eyebrow="Welcome back" title="Sign in to KGDS" />
          <label>Email</label>
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
          <label>Password</label>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="button" onClick={submit} disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          <button className="secondary-button" type="button">
            Continue with Google
          </button>
          <button className="link-button" type="button">
            Forgot password
          </button>
          <p className="form-note">Local MVP account: admin / admin. Google login remains a placeholder.</p>
        </Card>
      </main>
    </PublicLayout>
  );
}

function RegisterSchoolPage() {
  return (
    <PublicLayout>
      <main className="narrow-page">
        <SectionHeader eyebrow="Onboarding" title="Register a school workspace" text="A guided placeholder flow for school profile, admin account, plan selection, and billing." />
        <div className="wizard-grid">
          {["School information", "Admin account", "Choose plan", "Billing/payment placeholder", "Create workspace"].map((step, index) => (
            <Card key={step}>
              <span className="step-number">{index + 1}</span>
              <h3>{step}</h3>
              <p>{index === 4 ? "Workspace creation will connect to backend school and user APIs later." : "Collect the minimum fields required for a school-ready SaaS setup."}</p>
            </Card>
          ))}
        </div>
      </main>
    </PublicLayout>
  );
}

function DashboardHome() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Admin dashboard</p>
          <h1>{user?.school_name || school.name}</h1>
        </div>
        <Badge tone="gold">Academic year {school.academicYear}</Badge>
      </section>
      <div className="metric-grid">
        <MetricCard label="Active students" value="248" detail="12 returnee cases" />
        <MetricCard label="Open cases" value="15" detail="4 awaiting teacher review" tone="gold" />
        <MetricCard label="High-priority support cases" value="3" detail="Math focus" tone="red" />
        <MetricCard label="Teacher actions pending" value="7" detail="Across 4 classes" />
        <MetricCard label="Analyses this week" value="11" detail="2 persisted reports" tone="green" />
      </div>
      <div className="dashboard-grid">
        <RecentCases />
        <Card>
          <h3>Teacher activity</h3>
          {teacherActions.map((action) => (
            <p className="activity-row" key={action}>
              <Badge tone="slate">Action</Badge>
              {action}
            </p>
          ))}
        </Card>
        <Card className="wide-card">
          <h3>Intervention tracking</h3>
          <div className="progress-row"><span>Bridge sessions assigned</span><strong>8 / 12</strong></div>
          <div className="progress-row"><span>Teacher feedback received</span><strong>5 / 7</strong></div>
          <div className="progress-row"><span>Resolved prerequisite alerts</span><strong>2 / 3</strong></div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function RecentCases() {
  return (
    <Card>
      <h3>Recent cases</h3>
      {students.slice(0, 3).map((student) => (
        <button className="list-row" key={student.id} type="button" onClick={() => navigate(`/dashboard/students/${student.id}`)}>
          <span>
            <strong>{student.name}</strong>
            <small>Grade {student.grade} {student.stream}</small>
          </span>
          <Badge tone={student.priority === "High" ? "red" : "gold"}>{student.priority}</Badge>
        </button>
      ))}
    </Card>
  );
}

function StudentsListPage() {
  const { user } = useAuth();
  const [realStudents, setRealStudents] = useState<Student[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [form, setForm] = useState<RegistrationForm>({
    full_name: "Sami Al-Hassan",
    mother_name: "Rana Al-Hassan",
    father_name: "Mahmoud Al-Hassan",
    date_of_birth: "2008-04-12",
    target_grade: "12",
    target_stream: "Scientific",
    student_phone: "0991000001",
    mother_phone: "0991000002",
    father_phone: "0991000003",
    studied_outside_syria: true,
    studied_country: "Turkey",
    other_country: "",
    years_count: 3,
    notes: "Registered through school admin intake workflow.",
  });
  const defaultCountry = form.studied_outside_syria ? (form.studied_country === "Other" ? form.other_country || "Turkey" : form.studied_country) : "Syria";
  const [priorRows, setPriorRows] = useState<PriorEducationRow[]>(() => buildPriorRows("12", 3, "Turkey"));

  const loadStudents = async () => {
    try {
      const rows = await api.getStudents(user?.school_id);
      setRealStudents(rows.map(apiStudentToStudent));
      setUsingFallback(false);
      setError(null);
    } catch (exc) {
      setRealStudents(students);
      setUsingFallback(true);
      setError(exc instanceof Error ? exc.message : "Could not load students");
    }
  };

  useEffect(() => {
    void loadStudents();
  }, [user?.school_id]);

  const updateForm = (field: keyof RegistrationForm, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const continueRegistration = () => {
    setError(null);
    if (!form.full_name || !form.mother_name || !form.father_name || !form.date_of_birth || !form.target_grade || !form.target_stream) {
      setError("Student name, parents, birth date, target grade, and stream are required.");
      return;
    }
    if (!form.student_phone || !form.mother_phone || !form.father_phone) {
      setError("Student, mother, and father phone numbers are required for registration.");
      return;
    }
    setPriorRows(buildPriorRows(form.target_grade, form.years_count, defaultCountry));
    setRegistrationOpen(true);
  };

  const updatePriorRow = (index: number, field: keyof PriorEducationRow, value: string) => {
    setPriorRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const submitRegistration = async () => {
    if (!user?.school_id) {
      setError("Current user has no school_id; bootstrap the demo admin account first.");
      return;
    }
    try {
      const response = await api.registerStudent({
        school_id: user.school_id,
        full_name: form.full_name,
        mother_name: form.mother_name,
        father_name: form.father_name,
        date_of_birth: form.date_of_birth,
        target_grade: form.target_grade,
        target_stream: form.target_stream,
        student_phone: form.student_phone,
        mother_phone: form.mother_phone,
        father_phone: form.father_phone,
        studied_outside_syria: form.studied_outside_syria,
        studied_country: defaultCountry,
        prior_education: priorRows,
        notes: form.notes,
      });
      const created = (response as { student: ApiStudent }).student;
      setRealStudents((current) => [...current, apiStudentToStudent(created)]);
      setUsingFallback(false);
      setError(null);
      setSavedMessage(`Student registered. Case is ready for analysis: ${(response as { case?: { case_code?: string } }).case?.case_code || "created"}`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not register student");
    }
  };

  const visibleStudents = realStudents.length ? realStudents : students;

  return (
    <DashboardLayout>
      <PageTitle eyebrow="Students" title="Student registry" />
      {usingFallback ? <p className="fallback-note">Using mock fallback because the backend students API is unavailable.</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {savedMessage ? <p className="success-note">{savedMessage}</p> : null}
      <Card className="wide-card registration-card">
        <div className="section-inline-title">
          <div>
            <h3>Register student in school</h3>
            <p>Required identity and contact fields are saved before optional education history.</p>
          </div>
          <Badge tone="gold">School registration</Badge>
        </div>
        <div className="form-grid">
          <label>Student name<input value={form.full_name} onChange={(event) => updateForm("full_name", event.target.value)} /></label>
          <label>Mother name<input value={form.mother_name} onChange={(event) => updateForm("mother_name", event.target.value)} /></label>
          <label>Father name<input value={form.father_name} onChange={(event) => updateForm("father_name", event.target.value)} /></label>
          <label>Birth date<input type="date" value={form.date_of_birth} onChange={(event) => updateForm("date_of_birth", event.target.value)} /></label>
          <label>Target grade<input value={form.target_grade} onChange={(event) => updateForm("target_grade", event.target.value)} /></label>
          <label>Stream<select value={form.target_stream} onChange={(event) => updateForm("target_stream", event.target.value)}><option>Scientific</option><option>Literary</option><option>General</option></select></label>
          <label>Student phone<input value={form.student_phone} onChange={(event) => updateForm("student_phone", event.target.value)} /></label>
          <label>Mother phone<input value={form.mother_phone} onChange={(event) => updateForm("mother_phone", event.target.value)} /></label>
          <label>Father phone<input value={form.father_phone} onChange={(event) => updateForm("father_phone", event.target.value)} /></label>
        </div>
        <button className="primary-button" type="button" onClick={continueRegistration}>Continue</button>
        {registrationOpen ? (
          <div className="registration-secondary">
            <div className="summary-strip">
              <strong>{form.full_name}</strong>
              <span>Father: {form.father_name}</span>
              <span>Mother: {form.mother_name}</span>
              <span>Grade {form.target_grade} / {form.target_stream}</span>
            </div>
            <div className="form-grid">
              <label>Studied outside Syria?
                <select value={form.studied_outside_syria ? "yes" : "no"} onChange={(event) => updateForm("studied_outside_syria", event.target.value === "yes")}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label>Country
                <select value={form.studied_country} disabled={!form.studied_outside_syria} onChange={(event) => updateForm("studied_country", event.target.value)}>
                  <option>Turkey</option>
                  <option>Other</option>
                </select>
              </label>
              <label>Other country<input disabled={form.studied_country !== "Other"} value={form.other_country} onChange={(event) => updateForm("other_country", event.target.value)} /></label>
              <label>Years count<input type="number" min={0} max={11} value={form.years_count} onChange={(event) => updateForm("years_count", Math.min(11, Number(event.target.value)))} /></label>
              <label className="full-field">Registration notes<textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} /></label>
            </div>
            <button className="secondary-button" type="button" onClick={() => setPriorRows(buildPriorRows(form.target_grade, form.years_count, defaultCountry))}>
              Generate previous grades
            </button>
            <div className="prior-grade-list">
              {priorRows.map((row, index) => (
                <div className="prior-grade-row" key={row.grade}>
                  <strong>Grade {row.grade}</strong>
                  <select value={row.country} onChange={(event) => updatePriorRow(index, "country", event.target.value)}><option>Turkey</option><option>Syria</option><option>Other</option></select>
                  <select value={row.stream} onChange={(event) => updatePriorRow(index, "stream", event.target.value)}><option>Scientific</option><option>Literary</option><option>General</option></select>
                  <input placeholder="School name" value={row.school_name} onChange={(event) => updatePriorRow(index, "school_name", event.target.value)} />
                  <select value={row.document_type} onChange={(event) => updatePriorRow(index, "document_type", event.target.value as "pdf" | "image")}><option value="pdf">PDF</option><option value="image">IMG</option></select>
                  <label className="file-pill">Upload<input type="file" accept={row.document_type === "pdf" ? "application/pdf" : "image/*"} onChange={(event) => {
                    const file = event.target.files?.[0];
                    updatePriorRow(index, "original_filename", file?.name || "");
                    updatePriorRow(index, "mime_type", file?.type || "");
                  }} /></label>
                  <small>{row.original_filename || "No file selected"}</small>
                </div>
              ))}
            </div>
            <button className="primary-button" type="button" onClick={submitRegistration}>Complete registration</button>
            <p className="form-note">File binaries are not uploaded yet. The MVP stores report-card metadata in uploaded_documents for later storage integration.</p>
          </div>
        ) : null}
      </Card>
      <div className="filter-bar">
        <span><Search size={16} /> Search students</span>
        {["Grade", "Section", "Stream", "Status"].map((filter) => <button key={filter} type="button"><Filter size={15} /> {filter}</button>)}
      </div>
      <Card>
        <table>
          <thead><tr><th>Name</th><th>Grade</th><th>Stream</th><th>Origin</th><th>Status</th><th>Priority</th></tr></thead>
          <tbody>
            {visibleStudents.map((student) => (
              <tr key={student.id} onClick={() => navigate(`/dashboard/students/${student.id}`)}>
                <td>{student.name}</td>
                <td>{student.grade}-{student.section}</td>
                <td>{student.stream}</td>
                <td>{student.originCountry}</td>
                <td>{student.status}</td>
                <td><Badge tone={student.priority === "High" ? "red" : "slate"}>{student.priority}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardLayout>
  );
}

function StudentProfilePage() {
  const student = students[0];
  return (
    <DashboardLayout>
      <PageTitle eyebrow="Student profile" title={student.name} action="Run analysis" onAction={() => navigate("/dashboard/run-analysis")} />
      <div className="dashboard-grid">
        <Card>
          <h3>Identity</h3>
          <p>Grade {student.grade}, Section {student.section}, {student.stream}</p>
          <p>School: {school.name}</p>
          <p>Date of birth: Placeholder</p>
          <Badge tone="gold">{student.status}</Badge>
        </Card>
        <Card>
          <h3>Education path</h3>
          <p>Turkey: grades 9, 10, 11</p>
          <p>Syria target: Grade 12 Scientific</p>
          <p>Subject focus: Math</p>
        </Card>
        <Card>
          <h3>Documents</h3>
          <p>Certificate scan placeholder</p>
          <p>Report card extraction placeholder</p>
        </Card>
        <Card>
          <h3>Cases</h3>
          <button className="list-row" type="button" onClick={() => navigate("/dashboard/cases/SC_SMOKE_001")}>
            <strong>{studentCase.id}</strong>
            <Badge tone="green">{studentCase.status}</Badge>
          </button>
        </Card>
        <Card className="wide-card">
          <h3>Analysis history</h3>
          <p>Latest report uses mock sample values until backend report retrieval is wired.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function CaseDetailPage() {
  return (
    <DashboardLayout>
      <PageTitle eyebrow="Student case" title={studentCase.id} action="Run analysis" onAction={() => navigate("/dashboard/run-analysis")} />
      <div className="dashboard-grid">
        <Card><h3>Case metadata</h3><p>Status: {studentCase.status}</p><p>Student: Sami Al-Hassan</p></Card>
        <Card><h3>Curriculum context</h3><p>Origin: {studentCase.originCountry}</p><p>Grades abroad: {studentCase.gradesStudiedAbroad.join(", ")}</p></Card>
        <Card><h3>Target</h3><p>{studentCase.targetCountry} Grade {studentCase.targetGrade}</p><p>{studentCase.targetStream} / {studentCase.subjectFocus}</p></Card>
        <Card className="wide-card"><h3>Notes</h3><p>{studentCase.notes}</p></Card>
      </div>
    </DashboardLayout>
  );
}

function RunAnalysisPage() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(() => getStoredAnalysis());
  const [studentMatches, setStudentMatches] = useState<ApiStudent[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [payload, setPayload] = useState<AnalysisPayload>(() => ({
    case_id: "SC_FRONTEND_MVP_001",
    origin_country: "Turkey",
    grades_studied_abroad: ["9", "10", "11"],
    last_completed_grade_abroad: "11",
    target_country: "Syria",
    target_grade: "12",
    target_stream: "Scientific",
    subject_focus: "Math",
    overall_difficulty: 6,
    math_difficulty: 7,
    notes: studentCase.notes,
    extra_fields: {},
  }));
  const [studentGraph, setStudentGraph] = useState<GraphResponse | null>(null);
  const [curriculumGraph, setCurriculumGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (studentQuery.trim().length < 2) {
      setStudentMatches([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void searchStudents(studentQuery);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [studentQuery, user?.school_id]);

  const searchStudents = async (query = studentQuery) => {
    setError(null);
    try {
      const rows = await api.getStudents(user?.school_id, query);
      setStudentMatches(rows);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Student search failed");
    }
  };

  const selectStudent = async (student: ApiStudent) => {
    try {
      setStudentQuery(student.full_name);
      setStudentMatches([]);
      const loaded = await api.getStudentProfile(student.id);
      setProfile(loaded);
      setPayload(summarizeAnalysisPayload(loaded));
      setAnalysis(null);
      setStudentGraph(null);
      setCurriculumGraph(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load student profile");
    }
  };

  const updatePayload = <K extends keyof AnalysisPayload>(field: K, value: AnalysisPayload[K]) => {
    setPayload((current) => ({ ...current, [field]: value }));
  };

  const runAnalysis = async () => {
    setRunning(true);
    setError(null);
    try {
      const response = await api.analyzeStudentCase(payload);
      const [studentGraphResponse, curriculumGraphResponse] = await Promise.all([
        api.getStudentGraph(payload),
        api.getCurriculumGraph({
          country: payload.target_country,
          grade: payload.target_grade,
          stream: payload.target_stream,
          subject: payload.subject_focus,
          core_only: true,
        }),
      ]);
      setStudentGraph(studentGraphResponse);
      setCurriculumGraph(curriculumGraphResponse);
      localStorage.setItem("kgds_latest_analysis", JSON.stringify(response));
      setAnalysis(response);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Analysis failed");
    } finally {
      setRunning(false);
    }
  };

  const selected = profile?.student;

  return (
    <DashboardLayout>
      <PageTitle eyebrow="Analysis" title="Run learning-gap analysis" action={running ? "Running..." : "Run analysis"} onAction={runAnalysis} />
      {error ? <p className="error-text">{error}</p> : null}
      <Card className="wide-card">
        <h3>Find student</h3>
        <div className="student-search-row autocomplete-wrap">
          <input placeholder="Search by student name, father, mother, or ID" value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} />
          <button className="primary-button" type="button" onClick={() => searchStudents()}>Search</button>
          {studentMatches.length ? (
            <div className="autocomplete-panel">
              {studentMatches.slice(0, 8).map((student) => (
                <button key={student.id} type="button" onClick={() => selectStudent(student)}>
                  <strong>{student.full_name}</strong>
                  <span>ID {student.id} - Father {student.father_name || "-"} - Mother {student.mother_name || "-"}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="student-match-list">
          {studentMatches.map((student) => (
            <button className="list-row" key={student.id} type="button" onClick={() => selectStudent(student)}>
              <span>
                <strong>{student.full_name}</strong>
                <small>ID {student.id} - Father {student.father_name || "-"} - Mother {student.mother_name || "-"}</small>
              </span>
              <Badge tone="slate">Grade {student.current_grade || "-"}</Badge>
            </button>
          ))}
        </div>
      </Card>
      <div className="dashboard-grid">
        <Card>
          <h3>Identity confirmation</h3>
          <p>Full name: {selected?.full_name || "Select a student"}</p>
          <p>Father: {selected?.father_name || "-"}</p>
          <p>Mother: {selected?.mother_name || "-"}</p>
          <p>Grade: {selected?.current_grade || payload.target_grade}, {selected?.current_stream || payload.target_stream}</p>
          <p>Date of birth: {selected?.date_of_birth || "Not registered"}</p>
          <p>School: {user?.school_name || school.name}</p>
        </Card>
        <Card>
          <h3>Registered education path</h3>
          {profile?.education_paths.length ? profile.education_paths.map((path) => (
            <p key={path.id}>Grade {path.grade}: {path.country}, {path.stream || "-"}, {path.school_name || "school not entered"}</p>
          )) : <p>Select a student to load previous grades.</p>}
        </Card>
        <Card className="wide-card">
          <h3>Analysis context</h3>
          <div className="form-grid">
            <label>Origin country<input value={payload.origin_country} onChange={(event) => updatePayload("origin_country", event.target.value)} /></label>
            <label>Grades studied abroad<input value={payload.grades_studied_abroad.join(", ")} onChange={(event) => updatePayload("grades_studied_abroad", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label>
            <label>Last completed grade abroad<input value={payload.last_completed_grade_abroad} onChange={(event) => updatePayload("last_completed_grade_abroad", event.target.value)} /></label>
            <label>Target country<input value={payload.target_country} onChange={(event) => updatePayload("target_country", event.target.value)} /></label>
            <label>Target grade<input value={payload.target_grade} onChange={(event) => updatePayload("target_grade", event.target.value)} /></label>
            <label>Target stream<select value={payload.target_stream} onChange={(event) => updatePayload("target_stream", event.target.value)}><option>Scientific</option><option>Literary</option><option>General</option></select></label>
            <label>Subject focus<input value={payload.subject_focus} onChange={(event) => updatePayload("subject_focus", event.target.value)} /></label>
            <label>Overall difficulty<input type="number" min={0} max={10} value={payload.overall_difficulty} onChange={(event) => updatePayload("overall_difficulty", Number(event.target.value))} /></label>
            <label>Math difficulty<input type="number" min={0} max={10} value={payload.math_difficulty} onChange={(event) => updatePayload("math_difficulty", Number(event.target.value))} /></label>
            <label className="full-field">Notes<textarea value={payload.notes} onChange={(event) => updatePayload("notes", event.target.value)} /></label>
          </div>
        </Card>
        {analysis ? (
          <Card className="wide-card">
            <h3>Generated report</h3>
            <div className="metric-grid compact-metrics">
              <MetricCard label="Analysis run" value={String(analysis.summary.analysis_run_id || "not persisted")} />
              <MetricCard label="Target topics" value={String(analysis.summary.n_target_topics || "-")} />
              <MetricCard label="Support topics" value={String(analysis.summary.n_support_topics || "-")} tone="gold" />
              <MetricCard label="Likely missed" value={String(analysis.summary.n_likely_missed_topics || "-")} tone="red" />
              <MetricCard label="Graph nodes" value={String(analysis.graph_summary.nodes_count || "-")} />
            </div>
            <ReportTopics analysis={analysis} />
            <button className="secondary-button" type="button" onClick={() => navigate(`/dashboard/reports/${payload.case_id}`)}>
              Open full report
            </button>
          </Card>
        ) : null}
        {analysis ? (
          <Card className="wide-card">
            <h3>Student knowledge graph</h3>
            <KnowledgeGraphCanvas graph={studentGraph} title="Student knowledge graph" subtitle={studentGraph ? `${studentGraph.nodes.length} nodes and ${studentGraph.edges.length} edges returned from backend.` : undefined} />
          </Card>
        ) : null}
        {analysis ? (
          <Card className="wide-card">
            <h3>Target curriculum graph</h3>
            <KnowledgeGraphCanvas graph={curriculumGraph} title="Target curriculum graph" subtitle={curriculumGraph ? `${curriculumGraph.nodes.length} nodes and ${curriculumGraph.edges.length} edges returned from backend.` : undefined} />
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function AnalysisReportPage() {
  const realAnalysis = getStoredAnalysis();
  const summary = realAnalysis?.summary;
  const graphSummary = realAnalysis?.graph_summary;

  return (
    <DashboardLayout>
      <PageTitle eyebrow="Analysis report" title="Sami Al-Hassan support brief" action="PDF export" />
      {realAnalysis ? <Badge tone="green">Real backend result</Badge> : <p className="fallback-note">Using mock fallback because no real analysis result is stored yet.</p>}
      <div className="metric-grid">
        <MetricCard label="Target topics" value={String(summary?.n_target_topics || analysisStats.targetTopics)} />
        <MetricCard label="Prerequisite links" value={String(summary?.n_direct_prereq_links || analysisStats.prerequisiteLinks)} />
        <MetricCard label="Support topics" value={String(summary?.n_support_topics || analysisStats.supportTopics)} tone="gold" />
        <MetricCard label="Likely missed topics" value={String(summary?.n_likely_missed_topics || analysisStats.likelyMissedTopics)} tone="red" />
        <MetricCard label="Covered abroad" value={String(summary?.n_likely_covered_abroad_topics || analysisStats.coveredAbroad)} tone="green" />
        <MetricCard label="Graph nodes" value={String(graphSummary?.nodes_count || analysisStats.graphNodes)} />
      </div>
      <div className="dashboard-grid">
        <ReportTopics analysis={realAnalysis} />
        <Card>
          <h3>Explanation</h3>
          <p>KGDS identified support-first topics because they are prerequisite nodes for the current Grade 12 Scientific Math path and appear likely missed due to curriculum switching.</p>
          <Badge tone="gold">Evidence confidence placeholder</Badge>
        </Card>
        <Card className="wide-card">
          <h3>Recommended actions</h3>
          {teacherActions.map((action) => <p className="activity-row" key={action}><CheckCircle2 size={16} /> {action}</p>)}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ReportTopics({ analysis }: { analysis?: AnalysisResponse | null }) {
  const rows = analysis?.support_first_topics.length
    ? analysis.support_first_topics.map((item) => ({
        topic: String(item.prereq_topic_name_en || item.from_topic_id || "Support topic"),
        target: String(item.supported_targets || "Target topic"),
        confidence: String(item.coverage_status || "backend"),
      }))
    : supportTopics;

  return (
    <Card>
      <h3>Support-first topics</h3>
      {rows.map((topic) => (
        <div className="topic-row" key={topic.topic}>
          <strong>{topic.topic}</strong>
          <span>{topic.target}</span>
          <Badge tone={topic.confidence === "High" || topic.confidence.includes("missed") ? "red" : "gold"}>{topic.confidence}</Badge>
        </div>
      ))}
    </Card>
  );
}

function KnowledgeGraphPage() {
  const legend = ["Target topic", "Likely missed prerequisite", "Likely covered abroad", "Bridge outside studied path", "Current target-grade path", "Curriculum topic"];
  const [curriculumGraph, setCurriculumGraph] = useState<GraphResponse | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCurriculumGraph({ country: "Syria", grade: "12", stream: "Scientific", subject: "Math", core_only: true })
      .then(setCurriculumGraph)
      .catch((exc) => setGraphError(exc instanceof Error ? exc.message : "Could not load curriculum graph"));
  }, []);

  return (
    <DashboardLayout>
      <PageTitle eyebrow="Knowledge graph" title="Curriculum relationship explorer" />
      <div className="graph-page">
        <Card className="graph-main">
          <div className="filter-bar compact">
            {["Grade", "Stream", "Subject", "Relation type", "Coverage status", "Show labels", "Missed prerequisites only"].map((filter) => <button key={filter} type="button">{filter}</button>)}
          </div>
          {graphError ? <p className="error-text">{graphError}</p> : null}
          <KnowledgeGraphCanvas graph={curriculumGraph} title="Live curriculum graph" />
        </Card>
        <Card className="inspector-panel">
          <h3>Inspector</h3>
          <p>Select a node to inspect topic details, relations, evidence, and support recommendations.</p>
          <h4>Legend</h4>
          {legend.map((item) => <p className="legend-row" key={item}><span />{item}</p>)}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function TeacherWorkspacePage() {
  return (
    <DashboardLayout>
      <PageTitle eyebrow="Teacher workspace" title={`${school.teacher}'s review queue`} />
      <div className="dashboard-grid">
        <Card><h3>Assigned classes</h3><p>Grade 12 Scientific A</p><p>Grade 11 Scientific B</p></Card>
        <Card><h3>Students needing review</h3>{students.slice(0, 3).map((student) => <p key={student.id}>{student.name}</p>)}</Card>
        <Card><h3>Pending feedback</h3><p>3 reports awaiting teacher feedback</p></Card>
        <Card className="wide-card">
          <h3>Feedback actions</h3>
          <div className="module-grid small">
            {["Useful", "Uncertain", "Resolved", "Needs assessment"].map((item) => <button key={item} type="button"><BadgeCheck size={16} />{item}</button>)}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function AnalyticsPage() {
  return (
    <DashboardLayout>
      <PageTitle eyebrow="Analytics" title="Privacy-aware school insights" />
      <div className="metric-grid">
        <MetricCard label="Cases by priority" value="3 high" />
        <MetricCard label="Gap distribution by grade" value="12th" detail="Highest concentration" />
        <MetricCard label="Support topics by subject" value="Math" tone="gold" />
        <MetricCard label="Analyses over time" value="+18%" tone="green" />
        <MetricCard label="Students requiring review" value="7" tone="red" />
        <MetricCard label="Data completeness score" value="82%" />
      </div>
      <Card className="chart-card"><BarChart3 size={42} /><p>Aggregated chart placeholders for dashboard planning.</p></Card>
    </DashboardLayout>
  );
}

function DocumentsPage() {
  return (
    <DashboardLayout>
      <PageTitle eyebrow="Documents" title="Documents and intake" />
      <div className="three-column">
        <Card><Upload size={24} /><h3>Upload Excel</h3><p>Bulk intake placeholder for student records.</p></Card>
        <Card><FileSpreadsheet size={24} /><h3>Certificate/report card</h3><p>Extraction confidence and review queue placeholder.</p></Card>
        <Card><ClipboardList size={24} /><h3>Human review</h3><p>Apply records to profile after review placeholder.</p></Card>
      </div>
    </DashboardLayout>
  );
}

function UsersRolesPage() {
  const { user } = useAuth();
  const [teacherEmail, setTeacherEmail] = useState("omar.khaled@school.example");
  const [teacherName, setTeacherName] = useState("Omar Khaled");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTeachers(user?.school_id)
      .then((rows) => {
        const names = (rows as Array<{ full_name?: string; email?: string }>).map((row) => row.full_name || row.email || "Teacher");
        setTeachers(names);
      })
      .catch(() => setMessage("Teacher list is using placeholder data until backend user API is reachable."));
  }, [user?.school_id]);

  const createTeacher = async () => {
    try {
      await api.createTeacher({
        full_name: teacherName,
        email: teacherEmail,
        password: "teacher123",
        role: "teacher",
        school_id: user?.school_id,
      });
      setTeachers((current) => [...current, teacherName]);
      setMessage("Teacher account created. Temporary local password: teacher123");
    } catch (exc) {
      setMessage(exc instanceof Error ? exc.message : "Could not create teacher account");
    }
  };

  return (
    <DashboardLayout>
      <PageTitle eyebrow="Users & roles" title="Current MVP authorization reference" />
      <Card className="wide-card">
        <h3>Create teacher account</h3>
        <div className="inline-form">
          <input value={teacherName} onChange={(event) => setTeacherName(event.target.value)} />
          <input value={teacherEmail} onChange={(event) => setTeacherEmail(event.target.value)} />
          <button className="primary-button" type="button" onClick={createTeacher}>
            Create teacher
          </button>
        </div>
        {message ? <p className="form-note">{message}</p> : null}
        <p className="form-note">Current teachers: {teachers.length ? teachers.join(", ") : "Omar Khaled (demo fallback)"}</p>
      </Card>
      <Card>
        <table>
          <thead><tr><th>Role</th>{permissions.map((permission) => <th key={permission}>{permission}</th>)}</tr></thead>
          <tbody>
            {roleMatrix.map((row) => (
              <tr key={row.role}>
                <td>{row.role}</td>
                {permissions.map((permission) => <td key={permission}>{row.permissions.includes(permission) ? "Y" : ""}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="subtle-note">Real RBAC enforcement is not implemented in this MVP UI.</p>
    </DashboardLayout>
  );
}

function SettingsPage() {
  return (
    <DashboardLayout>
      <PageTitle eyebrow="Settings" title="School workspace settings" />
      <div className="three-column">
        {["School profile", "Academic year", "Language placeholder", "Notifications", "Security placeholders"].map((item) => (
          <Card key={item}><Settings size={22} /><h3>{item}</h3><p>Configuration placeholder for later backend integration.</p></Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

function DeveloperConsolePage() {
  const { isDeveloper } = useAuth();
  if (!isDeveloper) {
    return <AccessRestricted />;
  }

  return (
    <DashboardLayout>
      <PageTitle eyebrow="Developer only" title="Platform diagnostics console" />
      <div className="dashboard-grid">
        {[
          ["API health", "GET /health"],
          ["DB health", "GET /db/health"],
          ["OpenAPI link", "/openapi.json"],
          ["Runtime config indicators", "DB configured, persistence enabled"],
          ["Curriculum import status", "Imported mock: 347 topics, 90 edges"],
          ["Analysis persistence status", "analysis_run_id present when enabled"],
        ].map(([title, text]) => (
          <Card key={title}><Lock size={18} /><h3>{title}</h3><p>{text}</p></Card>
        ))}
        <Card className="wide-card">
          <h3>API base URL</h3>
          <input value="http://127.0.0.1:8080" readOnly />
          <p className="form-note">This field is intentionally restricted to the developer console.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function AccessRestricted() {
  return (
    <DashboardLayout>
      <EmptyState
        title="Access restricted"
        text="The Developer Console is reserved for platform developer and super admin accounts. School admin users can continue using the school workspace."
      />
    </DashboardLayout>
  );
}

function LoginRequiredPage() {
  return (
    <PublicLayout>
      <main className="auth-page">
        <Card className="auth-card">
          <SectionHeader eyebrow="Session required" title="Sign in to continue" text="Use the local MVP school admin account to open the workspace." />
          <button className="primary-button" type="button" onClick={() => navigate("/login")}>
            Go to login
          </button>
        </Card>
      </main>
    </PublicLayout>
  );
}

function PageTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <section className="page-heading">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
      {action ? <button className="primary-button" type="button" onClick={onAction}>{action}<ArrowRight size={17} /></button> : null}
    </section>
  );
}

function NotFoundPage() {
  return (
    <DashboardLayout>
      <EmptyState title="Page placeholder" text="This route is registered for the MVP shell and can be expanded by the frontend team." />
    </DashboardLayout>
  );
}

export default function App() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isPrivateRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/teacher") || pathname === "/developer-console";
  const page = useMemo(() => {
    if (loading && isPrivateRoute) return <LoginRequiredPage />;
    if (pathname === "/") return <LandingPage />;
    if (pathname === "/about") return <AboutPage />;
    if (pathname === "/methodology") return <MethodologyPage />;
    if (pathname === "/login") return <LoginPage />;
    if (pathname === "/register-school") return <RegisterSchoolPage />;
    if (isPrivateRoute && !user) return <LoginRequiredPage />;
    if (pathname === "/dashboard") return <DashboardHome />;
    if (pathname === "/dashboard/students") return <StudentsListPage />;
    if (pathname.startsWith("/dashboard/students/")) return <StudentProfilePage />;
    if (pathname.startsWith("/dashboard/cases/")) return <CaseDetailPage />;
    if (pathname === "/dashboard/run-analysis") return <RunAnalysisPage />;
    if (pathname.startsWith("/dashboard/reports/")) return <AnalysisReportPage />;
    if (pathname === "/dashboard/knowledge-graph") return <KnowledgeGraphPage />;
    if (pathname === "/dashboard/analytics") return <AnalyticsPage />;
    if (pathname === "/dashboard/documents") return <DocumentsPage />;
    if (pathname === "/dashboard/users-roles") return <UsersRolesPage />;
    if (pathname === "/dashboard/settings") return <SettingsPage />;
    if (pathname === "/teacher" || pathname === "/teacher/students" || pathname.startsWith("/teacher/reports/")) {
      return <TeacherWorkspacePage />;
    }
    if (pathname === "/developer-console") return <DeveloperConsolePage />;
    return <NotFoundPage />;
  }, [isPrivateRoute, loading, pathname, user]);

  return page;
}
