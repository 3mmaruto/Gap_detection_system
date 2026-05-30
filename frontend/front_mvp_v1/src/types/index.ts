export type BadgeTone = "navy" | "gold" | "green" | "red" | "slate";

export type Student = {
  id: string | number;
  name: string;
  grade: string;
  section: string;
  stream: string;
  originCountry: string;
  status: string;
  priority: string;
};

export type CaseRecord = {
  id: string;
  studentId: string;
  originCountry: string;
  gradesStudiedAbroad: string[];
  targetCountry: string;
  targetGrade: string;
  targetStream: string;
  subjectFocus: string;
  status: string;
  notes: string;
};

export type AnalysisStats = {
  targetTopics: number;
  prerequisiteLinks: number;
  supportTopics: number;
  likelyMissedTopics: number;
  coveredAbroad: number;
  outsidePathBridges: number;
  graphNodes: number;
  graphEdges: number;
};

export type RolePermissionRow = {
  role: string;
  permissions: string[];
};

export type CurrentUser = {
  id: number;
  full_name: string;
  email: string | null;
  roles: string[];
  school_id: number | null;
  school_name: string | null;
};

export type ApiStudent = {
  id: number;
  school_id: number;
  student_number: string | null;
  full_name: string;
  father_name?: string | null;
  mother_name?: string | null;
  date_of_birth: string | null;
  current_grade: string | null;
  current_stream: string | null;
  student_phone?: string | null;
  mother_phone?: string | null;
  father_phone?: string | null;
  status: string;
};

export type StudentEducationPath = {
  id: number;
  student_id: number;
  case_id: number | null;
  grade: string;
  country: string;
  stream: string | null;
  school_name: string | null;
  evidence_type: string | null;
  notes: string | null;
  created_at: string;
};

export type ApiStudentCase = {
  id: number;
  student_id: number | null;
  school_id: number | null;
  case_code: string;
  origin_country: string | null;
  target_country: string;
  target_grade: string;
  target_stream: string | null;
  subject_focus: string;
  grades_studied_abroad: string[] | Record<string, unknown> | null;
  last_completed_grade_abroad: string | null;
  overall_difficulty: number | null;
  math_difficulty: number | null;
  notes: string | null;
  source_type: string;
  status: string;
};

export type UploadedDocument = {
  id: number;
  document_type: string | null;
  original_filename: string;
  storage_uri: string;
  mime_type: string | null;
  upload_status: string;
  metadata_json: Record<string, unknown> | null;
};

export type StudentProfile = {
  student: ApiStudent;
  cases: ApiStudentCase[];
  education_paths: StudentEducationPath[];
  documents: UploadedDocument[];
};

export type AnalysisResponse = {
  summary: Record<string, unknown>;
  teacher_alert_report: Record<string, unknown>[];
  support_first_topics: Record<string, unknown>[];
  graph_summary: Record<string, unknown>;
};

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphNode = {
  id: string | number;
  label?: string | null;
  group?: string | null;
  type?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

export type GraphEdge = {
  source: string | number;
  target: string | number;
  type?: string | null;
  strength?: string | number | null;
  status?: string | null;
  [key: string]: unknown;
};
