import type { AnalysisStats, CaseRecord, RolePermissionRow, Student } from "../types";

export const school = {
  name: "Damascus Reintegration School",
  admin: "Lina Haddad",
  teacher: "Omar Khaled",
  academicYear: "2026",
  plan: "Institutional pilot",
};

export const students: Student[] = [
  {
    id: "sami-al-hassan",
    name: "Sami Al-Hassan",
    grade: "12",
    section: "A",
    stream: "Scientific",
    originCountry: "Turkey",
    status: "Needs review",
    priority: "High",
  },
  {
    id: "maya-hamdan",
    name: "Maya Hamdan",
    grade: "11",
    section: "B",
    stream: "Scientific",
    originCountry: "Lebanon",
    status: "In support plan",
    priority: "Medium",
  },
  {
    id: "nour-darwish",
    name: "Nour Darwish",
    grade: "10",
    section: "C",
    stream: "General",
    originCountry: "Jordan",
    status: "Documents pending",
    priority: "Medium",
  },
  {
    id: "yazan-saleh",
    name: "Yazan Saleh",
    grade: "12",
    section: "A",
    stream: "Scientific",
    originCountry: "Turkey",
    status: "Resolved",
    priority: "Low",
  },
];

export const studentCase: CaseRecord = {
  id: "SC_SMOKE_001",
  studentId: "sami-al-hassan",
  originCountry: "Turkey",
  gradesStudiedAbroad: ["9", "10", "11"],
  targetCountry: "Syria",
  targetGrade: "12",
  targetStream: "Scientific",
  subjectFocus: "Math",
  status: "Ready for analysis",
  notes: "Returning student preparing for Syrian scientific stream mathematics.",
};

export const analysisStats: AnalysisStats = {
  targetTopics: 63,
  prerequisiteLinks: 38,
  supportTopics: 34,
  likelyMissedTopics: 3,
  coveredAbroad: 1,
  outsidePathBridges: 2,
  graphNodes: 69,
  graphEdges: 38,
};

export const supportTopics = [
  {
    topic: "Concept of a Numerical Function",
    grade: "10",
    relation: "conceptual_foundation",
    target: "Limit of a Function at Infinity",
    confidence: "High",
  },
  {
    topic: "Definition and Expressions of the Dot Product",
    grade: "11",
    relation: "review_dependency",
    target: "Dot Product in the Plane (Review)",
    confidence: "High",
  },
  {
    topic: "Conditional Probability",
    grade: "11",
    relation: "review_dependency",
    target: "Conditional Probability",
    confidence: "Medium",
  },
];

export const teacherActions = [
  "Confirm prerequisite coverage with a short diagnostic task.",
  "Assign a 2-session bridge activity before Grade 12 limit work.",
  "Mark report usefulness after first support intervention.",
];

export const permissions = [
  "schools:manage",
  "users:manage",
  "students:manage",
  "curriculum:manage",
  "analysis:run",
  "analysis:view",
  "documents:upload",
  "documents:review",
  "analytics:view_ministry",
  "analytics:view_school",
];

export const roleMatrix: RolePermissionRow[] = [
  { role: "platform_super_admin", permissions },
  { role: "ministry_admin", permissions: permissions.filter((item) => item !== "schools:manage") },
  { role: "ministry_analyst", permissions: permissions.filter((item) => item !== "schools:manage") },
  { role: "school_admin", permissions: permissions.filter((item) => item !== "schools:manage") },
  { role: "teacher", permissions: permissions.filter((item) => item !== "schools:manage") },
  { role: "student", permissions: permissions.filter((item) => item !== "schools:manage") },
];

export const graphNodes = [
  { id: "target-1", label: "Limit of a Function", x: 58, y: 18, status: "Target topic" },
  { id: "missed-1", label: "Numerical Function", x: 22, y: 36, status: "Likely missed prerequisite" },
  { id: "covered-1", label: "Sequences", x: 72, y: 42, status: "Likely covered abroad" },
  { id: "bridge-1", label: "Dot Product Review", x: 38, y: 66, status: "Bridge outside studied path" },
  { id: "path-1", label: "Continuity", x: 76, y: 74, status: "Current target-grade path" },
];

export const graphEdges = [
  ["missed-1", "target-1"],
  ["covered-1", "target-1"],
  ["bridge-1", "path-1"],
  ["target-1", "path-1"],
];
