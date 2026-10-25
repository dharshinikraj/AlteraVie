import { Link } from "react-router-dom";

const STAGES = [
  { n: "01", key: "profile", label: "Health Profile", path: "/profile", desc: "Simple health & habits quiz" },
  { n: "02", key: "prediction", label: "Health Needs", path: "/prediction", desc: "Personalized risk check" },
  { n: "03", key: "nutrition", label: "Food Science", path: "/nutrition", desc: "Cooking & absorption tips" },
  { n: "04", key: "recommendations", label: "Your Plan", path: "/recommendations", desc: "Personalized meal plan" },
];

export default function Sidebar({ activeKey, completedKeys = [] }) {
  if (activeKey === "recommendations" || completedKeys.length >= 4) {
    return null;
  }

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24 space-y-0">
        {STAGES.map((stage, i) => {
          const isActive = stage.key === activeKey;
          const isDone = completedKeys.includes(stage.key);
          const isLast = i === STAGES.length - 1;
          const clickable = isDone || isActive;

          const content = (
            <div className="flex gap-3 pb-8 relative group">
              {!isLast && (
                <span
                  className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] transition-colors duration-300 ${
                    isDone ? "bg-[#3AAE6F]" : "bg-[#DCEBD8] dark:bg-slate-800"
                  }`}
                />
              )}
              <span
                className={`text-[11px] font-bold w-8 h-8 rounded-full grid place-items-center shrink-0 border transition-all duration-300 shadow-xs ${
                  isActive
                    ? "bg-[#3AAE6F] border-[#3AAE6F] text-white shadow-md shadow-[#3AAE6F]/20 scale-105"
                    : isDone
                    ? "bg-[#DCEBD8] dark:bg-emerald-950/60 border-[#3AAE6F]/30 dark:border-emerald-800 text-[#3AAE6F] dark:text-emerald-300"
                    : "bg-white dark:bg-slate-800 border-[#4A4A4A]/20 dark:border-slate-700 text-[#4A4A4A]/50 dark:text-slate-400"
                }`}
              >
                {isDone ? "✓" : stage.n}
              </span>
              <div className="pt-0.5">
                <p
                  className={`text-sm font-semibold transition-colors ${
                    isActive ? "text-[#4A4A4A] dark:text-slate-100 font-bold" : "text-[#4A4A4A]/70 dark:text-slate-300 group-hover:text-[#4A4A4A] dark:group-hover:text-slate-100"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-[#4A4A4A]/60 dark:text-slate-400 mt-0.5 leading-snug">
                  {stage.desc}
                </p>
              </div>
            </div>
          );

          return clickable ? (
            <Link key={stage.key} to={stage.path} className="block">
              {content}
            </Link>
          ) : (
            <div key={stage.key} className="opacity-50 cursor-not-allowed">
              {content}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
