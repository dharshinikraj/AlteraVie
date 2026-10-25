import { useState, useMemo } from "react";
import { useAssessment } from "../context/AssessmentContext";
import DeficiencyDeals from "../components/DeficiencyDeals";
import { ShieldCheck, Tag, Sparkles, CheckCircle2, AlertCircle, ShoppingBag, ExternalLink, Filter, Info, Flame, Award } from "lucide-react";

export default function Supplements() {
  const { profile, prediction, recommendation, user } = useAssessment();

  // Extract user's predicted deficiencies if available
  const userDeficiencies = useMemo(() => {
    if (prediction?.top_deficiencies && prediction.top_deficiencies.length > 0) {
      return prediction.top_deficiencies;
    }
    const defs = [];
    if (profile.symptom_fatigue || profile.pale_skin || profile.iron_level) defs.push("Iron");
    if (profile.bone_pain || profile.symptom_bone_pain || profile.vitamin_d_level) defs.push("Vitamin D");
    if (profile.numbness_tingling || profile.brain_fog || profile.vitamin_b12_level) defs.push("Vitamin B12");
    if (profile.muscle_cramps || profile.calcium_level) defs.push("Calcium");
    return defs.length > 0 ? defs : ["Iron", "Vitamin D", "Vitamin B12"];
  }, [profile, prediction]);

  // Combine backend deals if available
  const dealsFromBackend = recommendation?.deals_on_sale || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-7">
      {/* Page Hero Header */}
      <section className="bg-gradient-to-br from-emerald-600 via-[#3AAE6F] to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deficiency-Targeted Sale Offers</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight leading-tight">
            Verified Supplement Deals &amp; Discounts
          </h1>

          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Curated, legitimate deals on high-bioavailability supplements matched directly to your detected nutrient deficiencies across top platforms like <strong className="text-white underline underline-offset-4 font-bold">Amazon, Flipkart, Tata 1mg, PharmEasy, &amp; HealthKart</strong>.
          </p>

          {/* User Deficiencies Badge Bar */}
          {userDeficiencies.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white/80">
                Your Priority Target Nutrients:
              </span>
              {userDeficiencies.map((def, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-white text-[#278657] font-extrabold text-xs shadow-xs flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3AAE6F]" />
                  {def}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#3AAE6F] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">100% Legitimate Stores</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct verified links to official brand stores on Amazon, Flipkart &amp; 1mg.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Active On-Sale Prices</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Discounts range from 25% to 43% OFF with active coupon savings.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Clinical Formulations</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">High-absorptive forms (Bisglycinate, D3+K2, Methylcobalamin).</p>
          </div>
        </div>
      </div>

      {/* Main Deals Component */}
      <DeficiencyDeals
        deals={dealsFromBackend}
        title="Active Supplement Sales Matched to Deficiency"
      />

      {/* Clinical Guidance Accordion / Card */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-[#3AAE6F]" />
          <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
            Clinical Best Practices for Supplement Timing &amp; Absorption
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <span className="font-bold text-[#3AAE6F] block uppercase tracking-wider text-[10px]">
              🩸 Iron + Vitamin C
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Take Iron supplements on an empty stomach with citrus juice or Vitamin C. Avoid coffee, tea, or dairy for 2 hours before and after.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <span className="font-bold text-[#3AAE6F] block uppercase tracking-wider text-[10px]">
              ☀️ Vitamin D3 + Meal Fats
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Vitamin D3 is fat-soluble. Take with your largest meal containing healthy fats (nuts, ghee, or eggs) for up to 50% better absorption.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <span className="font-bold text-[#3AAE6F] block uppercase tracking-wider text-[10px]">
              🦴 Calcium Separate from Iron
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Calcium competes directly with Iron for intestinal transport channels. Space Calcium and Iron intake at least 4 hours apart.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
