import {
  BarChart3,
  FileText,
  GraduationCap,
  Home,
  Network,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { navigate } from "../App";
import { useAuth } from "../auth/AuthContext";
import { school } from "../data/mockData";

const navItems = [
  { label: "Overview", path: "/dashboard", icon: Home },
  { label: "Students", path: "/dashboard/students", icon: GraduationCap },
  { label: "Run Analysis", path: "/dashboard/run-analysis", icon: UserRoundCheck },
  { label: "Knowledge Graph", path: "/dashboard/knowledge-graph", icon: Network },
  { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
  { label: "Documents", path: "/dashboard/documents", icon: FileText },
  { label: "Users & Roles", path: "/dashboard/users-roles", icon: ShieldCheck },
  { label: "Settings", path: "/dashboard/settings", icon: Settings },
  { label: "Teacher", path: "/teacher", icon: Users },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isDeveloper, logout } = useAuth();
  const schoolName = user?.school_name || school.name;
  const roleLabel = user?.roles[0] || "demo";

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <button className="brand-button dashboard-brand" type="button" onClick={() => navigate("/")}>
          <span className="brand-mark">K</span>
          <span>KGDS</span>
        </button>
        <p className="sidebar-school">{schoolName}</p>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.path} type="button" onClick={() => navigate(item.path)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="eyebrow">School workspace</p>
            <strong>{user?.full_name || school.admin}</strong>
            <span className="role-pill">{roleLabel}</span>
          </div>
          <div className="topbar-actions">
            {isDeveloper ? (
              <button type="button" onClick={() => navigate("/developer-console")}>
                Developer Console
              </button>
            ) : null}
            {user ? (
              <button type="button" onClick={logout}>
                Sign out
              </button>
            ) : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
