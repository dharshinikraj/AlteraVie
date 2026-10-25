import { useAssessment, THEMES_LIST } from "../context/AssessmentContext";
import { Check, Sparkles } from "lucide-react";

export default function ThemeSelector() {
  const { atmosphereTheme, changeAtmosphereTheme } = useAssessment();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#3AAE6F] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Visual Personality
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading mt-0.5">
            Choose your AlteraVie atmosphere
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          7 Themes Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {THEMES_LIST.map((theme) => {
          const isSelected = (atmosphereTheme || "botanical") === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => changeAtmosphereTheme(theme.id)}
              className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group ${
                isSelected
                  ? "bg-white dark:bg-slate-800/90 border-[#3AAE6F] shadow-md scale-[1.02] ring-2 ring-[#3AAE6F]/20"
                  : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{theme.emoji}</span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {theme.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                      {theme.desc}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#3AAE6F] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Color Swatches Strip */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Palette
                </span>
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/50 dark:bg-slate-700/50">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.primary }}
                    title="Primary"
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.accent }}
                    title="Accent"
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.bg }}
                    title="Background"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
