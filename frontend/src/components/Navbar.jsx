import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAssessment, THEMES_LIST } from "../context/AssessmentContext";
import { Leaf, LogOut, Sun, Moon, Palette, Check } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const { user, logout, theme, toggleTheme, atmosphereTheme, changeAtmosphereTheme } = useAssessment();
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (["/login", "/register"].includes(location.pathname)) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const currentThemeObj = THEMES_LIST.find((t) => t.id === (atmosphereTheme || "botanical")) || THEMES_LIST[0];

  return (
    <header className="app-topbar relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#3AAE6F] flex items-center justify-center text-white shadow-sm shrink-0">
            <Leaf className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="font-heading font-extrabold text-[17px] leading-tight tracking-tight text-slate-900 dark:text-white">AlteraVie</div>
            <div className="text-[10px] leading-tight font-semibold text-slate-500 dark:text-slate-400">Evidence-led nutrition</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 p-1">
          <DesktopTab to="/" label="Home" current={location.pathname} />
          {user && <DesktopTab to="/dashboard" label="Health" current={location.pathname} />}
          {user && <DesktopTab to="/food-vision" label="Scan" current={location.pathname} />}
          <DesktopTab to="/pantry" label="Pantry 🍳" current={location.pathname} />
          <DesktopTab to="/deals" label="Deals 🏷️" current={location.pathname} />
          {user && <DesktopTab to="/chat" label="AI" current={location.pathname} />}
          {user && <DesktopTab to="/profile" label="Profile" current={location.pathname} />}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Atmosphere Theme Selector Button */}
          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setShowThemeMenu((prev) => !prev)}
              className="icon-button flex items-center gap-1.5 px-2.5 w-auto text-xs font-bold"
              title="Change atmosphere theme"
              aria-label="Change atmosphere theme"
            >
              <Palette className="w-4 h-4 text-[#3AAE6F]" />
              <span className="hidden sm:inline-block">{currentThemeObj.emoji}</span>
            </button>

            {/* Atmosphere Theme Dropdown Popover */}
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1">
                <div className="px-2.5 py-1 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Atmosphere Themes
                </div>
                {THEMES_LIST.map((t) => {
                  const isSelected = (atmosphereTheme || "botanical") === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        changeAtmosphereTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#3AAE6F]/15 text-[#278657] dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t.emoji}</span>
                        <span>{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: t.primary }} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#3AAE6F]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" onClick={toggleTheme} className="icon-button" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <button type="button" onClick={handleLogout} className="icon-button hidden md:inline-flex" aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link to="/login" className="px-4 py-2 rounded-xl bg-[#3AAE6F] text-white text-sm font-bold">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function DesktopTab({ to, label, current }) {
  const active = current === to;
  return <Link to={to} className={`px-3.5 py-2 rounded-xl text-sm font-bold transition ${active ? "bg-white dark:bg-slate-700 text-[#278657] shadow-sm" : "text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}>{label}</Link>;
}
