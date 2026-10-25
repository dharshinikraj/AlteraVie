export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-[#FFFFFF] dark:bg-slate-900/90 rounded-2xl p-6 border border-[#3AAE6F]/20 dark:border-slate-800 card-stack-shadow transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionEyebrow({ children }) {
  return (
    <p className="label-eyebrow text-[#3AAE6F] mb-2 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F4B942] inline-block" />
      {children}
    </p>
  );
}

const RISK_CONFIG = {
  High: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
  Critical: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
  Deficient: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
  Moderate: { bg: "bg-[#F4B942]/20 dark:bg-[#F4B942]/10", text: "text-[#4A4A4A] dark:text-amber-200", border: "border-[#F4B942]", dot: "bg-[#F4B942]" },
  Warning: { bg: "bg-[#F4B942]/20 dark:bg-[#F4B942]/10", text: "text-[#4A4A4A] dark:text-amber-200", border: "border-[#F4B942]", dot: "bg-[#F4B942]" },
  Low: { bg: "bg-[#DCEBD8] dark:bg-emerald-950/60", text: "text-[#3AAE6F] dark:text-emerald-300", border: "border-[#3AAE6F]/30 dark:border-emerald-800", dot: "bg-[#3AAE6F]" },
  Optimal: { bg: "bg-[#DCEBD8] dark:bg-emerald-950/60", text: "text-[#3AAE6F] dark:text-emerald-300", border: "border-[#3AAE6F]/30 dark:border-emerald-800", dot: "bg-[#3AAE6F]" },
  Confirmed: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
  Unpredicted: { bg: "bg-[#F4B942]/20 dark:bg-[#F4B942]/10", text: "text-[#4A4A4A] dark:text-amber-200", border: "border-[#F4B942]", dot: "bg-[#F4B942]" },
  "Pre-clinical Risk": { bg: "bg-[#DCEBD8] dark:bg-emerald-950/60", text: "text-[#3AAE6F] dark:text-emerald-300", border: "border-[#3AAE6F]/30 dark:border-emerald-800", dot: "bg-[#3AAE6F]" },
  Unknown: { bg: "bg-[#4A4A4A]/10 dark:bg-slate-800", text: "text-[#4A4A4A] dark:text-slate-300", border: "border-[#4A4A4A]/20 dark:border-slate-700", dot: "bg-[#4A4A4A]" },
};

export function StatusBadge({ level, label }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG[label] || RISK_CONFIG.Unknown;
  const textLabel = label || `${level} risk`;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} shadow-xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {textLabel}
    </span>
  );
}

export function RiskBadge({ level }) {
  return <StatusBadge level={level} />;
}

export function NutrientCard({ nutrient, riskLevel, foods, cookingTip, avoid, lifestyleTip }) {
  // Deduplicate arrays to prevent AI hallucinations from showing "Lentils" multiple times
  const uniqueFoods = Array.from(new Set((foods || []).map(f => f.trim()))).filter(Boolean);
  const uniqueAvoid = Array.from(new Set((avoid || []).map(a => a.trim()))).filter(Boolean);

  return (
    <Card className="flex flex-col gap-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        <h3 className="font-display text-xl sm:text-2xl text-[#4A4A4A] dark:text-slate-100 font-bold">{nutrient}</h3>
        {riskLevel && <RiskBadge level={riskLevel} />}
      </div>

      {uniqueFoods.length > 0 && (
        <div>
          <SectionEyebrow>Recommended foods</SectionEyebrow>
          <div className="flex flex-wrap gap-2 mt-1">
            {uniqueFoods.map((f, i) => (
              <span
                key={`${f}-${i}`}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-[#DCEBD8] dark:bg-emerald-950/60 text-[#3AAE6F] dark:text-emerald-300 border border-[#3AAE6F]/30 dark:border-emerald-800 shadow-xs hover:bg-[#3AAE6F] hover:text-[#FFFFFF] transition-colors"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {cookingTip && (
        <div>
          <SectionEyebrow>Cooking suggestion</SectionEyebrow>
          <p className="text-xs text-[#4A4A4A]/90 dark:text-slate-300 leading-relaxed font-normal">{cookingTip}</p>
        </div>
      )}

      {uniqueAvoid.length > 0 && (
        <div>
          <SectionEyebrow>Time carefully / avoid</SectionEyebrow>
          <ul className="text-xs text-[#4A4A4A]/90 dark:text-slate-300 leading-relaxed list-disc list-inside space-y-1">
            {uniqueAvoid.map((a, i) => (
              <li key={`${a}-${i}`}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {lifestyleTip && (
        <div className="pt-3 border-t border-[#DCEBD8] dark:border-slate-800">
          <SectionEyebrow>Lifestyle advice</SectionEyebrow>
          <p className="text-xs text-[#4A4A4A]/90 dark:text-slate-300 leading-relaxed">{lifestyleTip}</p>
        </div>
      )}
    </Card>
  );
}
