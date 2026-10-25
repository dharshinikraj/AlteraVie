/**
 * Signature element: a lab-grade titration gauge probability bar with fine tick marks,
 * color shifts from emerald (low risk) through amber to rose (high risk), and smooth micro-animations.
 */
function colorForValue(pct) {
  if (pct >= 75) return { bar: "bg-gradient-to-r from-rose-400 to-rose-600", text: "text-rose-600 dark:text-rose-300 font-bold", bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900" };
  if (pct >= 50) return { bar: "bg-gradient-to-r from-amber-400 to-amber-500", text: "text-amber-600 dark:text-amber-300 font-bold", bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900" };
  return { bar: "bg-gradient-to-r from-emerald-400 to-emerald-600", text: "text-emerald-600 dark:text-emerald-300 font-semibold", bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900" };
}

export function ProbabilityBar({ label, percent }) {
  const { bar, text, bg } = colorForValue(percent);
  const ticks = Array.from({ length: 9 }, (_, i) => (i + 1) * 10);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <span className={`font-data text-xs px-2.5 py-0.5 rounded-full border ${bg} ${text}`}>
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-inner">
        <div
          className={`h-full rounded-full ${bar} transition-[width] duration-700 ease-out shadow-xs`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
        <div className="absolute inset-0 flex justify-between px-[1px] pointer-events-none">
          {ticks.map((t) => (
            <span key={t} className="w-px h-full bg-white/40 dark:bg-slate-700/60" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProbabilityGroup({ predictions }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {predictions.map((p) => (
        <ProbabilityBar key={p.nutrient} label={p.nutrient} percent={p.probability_percent} />
      ))}
    </div>
  );
}
