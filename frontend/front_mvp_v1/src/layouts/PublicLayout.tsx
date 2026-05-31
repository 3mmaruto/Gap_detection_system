import { BookOpen, LayoutDashboard } from "lucide-react";
import { navigate } from "../App";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <header className="public-nav">
        <button className="brand-button" type="button" onClick={() => navigate("/")}>
          <span className="brand-mark">K</span>
          <span>KGDS</span>
        </button>
        <nav>
          <button type="button" onClick={() => navigate("/about")}>
            About
          </button>
          <button type="button" onClick={() => navigate("/methodology")}>
            Methodology
          </button>
          <button type="button" onClick={() => navigate("/login/admin")}>
            Login
          </button>
          <button className="nav-cta" type="button" onClick={() => navigate("/register-school")}>
            <BookOpen size={16} />
            Request a Demo
          </button>
          <button className="icon-cta" type="button" onClick={() => navigate("/dashboard")} title="Explore dashboard">
            <LayoutDashboard size={18} />
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
