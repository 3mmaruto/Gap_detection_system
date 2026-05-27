import type { AnalysisResponse, ApiStudent, CurrentUser, GraphResponse, StudentProfile } from "../types";

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";

export const apiConfig = {
  baseUrl: DEFAULT_API_BASE_URL,
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("kgds_token");
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `KGDS API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { username: string; password: string }) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  bootstrapDemo: () => request("/auth/bootstrap-demo", { method: "POST" }),
  getCurrentUser: () => request<CurrentUser>("/auth/me"),
  getHealth: () => request("/health"),
  getDbHealth: () => request("/db/health"),
  getSchools: () => request("/schools"),
  createSchool: (payload: unknown) => request("/schools", { method: "POST", body: JSON.stringify(payload) }),
  getStudents: (schoolId?: number | null, q?: string) => {
    const params = new URLSearchParams();
    if (schoolId) params.set("school_id", String(schoolId));
    if (q) params.set("q", q);
    const query = params.toString();
    return request<ApiStudent[]>(query ? `/students?${query}` : "/students");
  },
  createStudent: (payload: unknown) => request<ApiStudent>("/students", { method: "POST", body: JSON.stringify(payload) }),
  registerStudent: (payload: unknown) => request("/students/register", { method: "POST", body: JSON.stringify(payload) }),
  getStudentProfile: (studentId: number | string) => request<StudentProfile>(`/students/${studentId}/profile`),
  getStudentCases: () => request("/student-cases"),
  createStudentCase: (payload: unknown) =>
    request("/student-cases", { method: "POST", body: JSON.stringify(payload) }),
  analyzeStudentCase: (payload: unknown) =>
    request<AnalysisResponse>("/analyze-student-case", { method: "POST", body: JSON.stringify(payload) }),
  createTeacher: (payload: unknown) => request("/users/teachers", { method: "POST", body: JSON.stringify(payload) }),
  getTeachers: (schoolId?: number | null) =>
    request(schoolId ? `/users?role=teacher&school_id=${schoolId}` : "/users?role=teacher"),
  getStudentGraph: (payload: unknown) => request<GraphResponse>("/student-graph", { method: "POST", body: JSON.stringify(payload) }),
  getCurriculumGraph: (payload: unknown) =>
    request<GraphResponse>("/curriculum-graph", { method: "POST", body: JSON.stringify(payload) }),
  getAnalysisRuns: () => request("/analysis-runs"),
  getAnalysisRun: (runId: number | string) => request(`/analysis-runs/${runId}`),
  getDetectedGaps: () => request("/detected-gaps"),
  getSupportRecommendations: () => request("/support-recommendations"),
};
