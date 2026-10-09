import { useRef } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { SITE_BASE } from "../lib/admissions";
import "../admissions.css";

export default function AdmissionsShell({ children, admin = false }) {
  const logoClicks = useRef(0);
  return (
    <div className={`admissions-page ${admin ? "admin-page" : ""}`}>
      <header className="admissions-header">
        <div className="admissions-nav">
          {admin ? (
            <a className="wordmark" href={SITE_BASE} aria-label="AIDE 홈">
              AIDE
              <span className="logo-dot" />
            </a>
          ) : (
            <button
              className="wordmark application-logo"
              aria-label="AIDE"
              onClick={() => {
                logoClicks.current += 1;
                if (logoClicks.current >= 5)
                  window.location.assign(`${SITE_BASE}admin/`);
              }}
            >
              AIDE
              <span className="logo-dot" />
            </button>
          )}
          <span className="admissions-nav-caption">
            {admin ? "STUDY ADMINISTRATION" : "YOUR IDEA STARTS HERE"}
          </span>
          <a className="admissions-home" href={SITE_BASE}>
            홈으로 돌아가기 <ArrowUpRight size={15} />
          </a>
        </div>
      </header>
      {children}
      <footer className="admissions-footer">
        <span>© {new Date().getFullYear()} AIDE. AI Design & Engineering.</span>
        <span>
          <Sparkles size={12} /> 작은 아이디어에서, 새로운 가능성으로.
        </span>
      </footer>
    </div>
  );
}
