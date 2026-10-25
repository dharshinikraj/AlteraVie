import { Home, HeartPulse, ScanLine, MessageCircleMore, UserRound, Tag, ChefHat } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAssessment } from "../context/AssessmentContext";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Health", icon: HeartPulse, auth: true },
  { to: "/food-vision", label: "Scan", icon: ScanLine, auth: true, primary: true },
  { to: "/pantry", label: "Pantry", icon: ChefHat },
  { to: "/deals", label: "Deals", icon: Tag },
  { to: "/chat", label: "AI", icon: MessageCircleMore, auth: true },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAssessment();

  if (["/login", "/register"].includes(location.pathname)) return null;

  return (
    <nav className="mobile-bottom-nav md:hidden" aria-label="Primary mobile navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map(({ to, label, icon: Icon, auth, primary }) => {
          const href = auth && !user ? "/login" : to;
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={href}
              aria-current={active ? "page" : undefined}
              className={`mobile-tab ${active ? "is-active" : ""} ${primary ? "is-primary" : ""}`}
            >
              <span className="mobile-tab-icon"><Icon size={primary ? 23 : 21} strokeWidth={active ? 2.5 : 2} /></span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
