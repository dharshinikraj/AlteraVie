import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Card, SectionEyebrow } from "../components/Cards";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";

const COOKING_METHODS = ["raw", "boiled", "steamed", "fried"];

export default function Nutrition() {
  const { profile, updateProfile, prediction, nutrition, setNutrition } = useAssessment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const focusNutrients =
    prediction?.top_deficiencies?.length > 0
      ? prediction.top_deficiencies
      : prediction?.predictions?.slice(0, 2).map((p) => p.nutrient) || [];

  const fetchNutrition = useCallback(
    (method) => {
      setLoading(true);
      setError(null);
      api
        .nutrition({
          age: Number(profile.age),
          gender: profile.gender,
          weight_kg: Number(profile.weight_kg),
          activity_level: profile.activity_level,
          diet: profile.diet,
          focus_nutrients: focusNutrients,
          cooking_method: method,
          allergies: profile.allergies || [],
          disliked_foods: profile.disliked_foods || [],
          occupation: profile.occupation || "Desk / Office Worker",
        })
        .then(setNutrition)
        .catch((err) => setError(err.message || "Nutrition analysis failed."))
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.age, profile.gender, profile.weight_kg, profile.activity_level, profile.diet]
  );

  useEffect(() => {
    if (!prediction) {
      navigate("/prediction");
      return;
    }
    if (!nutrition) fetchNutrition(profile.cooking_method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction]);

  function handleMethodChange(method) {
    updateProfile({ cooking_method: method });
    fetchNutrition(method);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col lg:flex-row gap-6 lg:gap-10 overflow-hidden">
      <Sidebar activeKey="nutrition" completedKeys={["profile", "prediction"]} />

      <div className="flex-1 w-full min-w-0 max-w-3xl space-y-8">
        <section className="pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <SectionEyebrow>Step 3 · Cooking & Food Science Tips</SectionEyebrow>
          <h1 className="font-display text-4xl text-slate-900 dark:text-slate-100 font-bold mt-1">How Cooking Affects Your Food</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Daily vitamin goals, top natural food sources, and simple cooking tips to keep natural vitamins in every meal.
          </p>
        </section>

        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Cooking Method:</span>
          <div className="flex items-center gap-2 mobile-scroll-row">
            {COOKING_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => handleMethodChange(m)}
                className={`text-xs font-data uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  profile.cooking_method === m
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/40"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <Card className="space-y-4 py-10">
            <div className="h-5 shimmer-bg rounded-full w-1/3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 shimmer-bg rounded-xl" />
              ))}
            </div>
          </Card>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {nutrition && !loading && (
          <div className="space-y-8">
            <Card className="hover:shadow-md transition-shadow">
              <SectionEyebrow>Daily Nutrient Targets</SectionEyebrow>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 font-data">
                <StatCard label="Calories" value={`${nutrition.daily_requirements.calories} kcal`} />
                <StatCard label="Protein" value={`${nutrition.daily_requirements.protein_g} g`} />
                <StatCard label="Iron" value={`${nutrition.daily_requirements.iron_mg} mg`} />
                <StatCard label="Calcium" value={`${nutrition.daily_requirements.calcium_mg} mg`} />
                <StatCard label="Vitamin D" value={`${nutrition.daily_requirements.vitamin_d_mcg} mcg`} />
                <StatCard label="Vitamin B12" value={`${nutrition.daily_requirements.vitamin_b12_mcg} mcg`} />
              </div>
            </Card>

            {nutrition.nutrient_analysis.map((section) => {
              const uniqueTopFoods = [];
              const seenTop = new Set();
              (section.top_foods || []).forEach(f => {
                const lower = f.name?.toLowerCase().trim();
                if (lower && !seenTop.has(lower)) {
                  seenTop.add(lower);
                  uniqueTopFoods.push(f);
                }
              });

              const uniqueExamples = [];
              const seenEx = new Set();
              (section.cooking_adjusted_examples || []).forEach(ex => {
                const lower = ex.food?.toLowerCase().trim();
                if (lower && !seenEx.has(lower)) {
                  seenEx.add(lower);
                  uniqueExamples.push(ex);
                }
              });

              return (
              <Card key={section.nutrient} className="hover:shadow-md transition-shadow">
                <SectionEyebrow>{section.nutrient} — Top Food Sources</SectionEyebrow>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 mb-6 font-data text-xs">
                  {uniqueTopFoods.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 py-2">
                      <span className="text-slate-800 dark:text-slate-200 font-semibold font-body">{f.name}</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                        {profile.cooking_method === "raw" ? f.amount_per_100g_raw : f.amount_per_100g_cooked}
                      </span>
                    </div>
                  ))}
                </div>

                {uniqueExamples.length > 0 && (
                  <>
                    <SectionEyebrow>
                      After {nutrition.cooking_method_used} Preparation (per 100g)
                    </SectionEyebrow>
                    <div className="overflow-x-auto mt-3 mobile-table-scroll">
                      <table className="w-full text-xs font-data">
                        <thead>
                          <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 pr-4 font-bold uppercase tracking-wider">Food</th>
                            <th className="py-2.5 pr-4 font-bold uppercase tracking-wider">Cal</th>
                            <th className="py-2.5 pr-4 font-bold uppercase tracking-wider">Protein</th>
                            <th className="py-2.5 pr-4 font-bold uppercase tracking-wider">Iron</th>
                            <th className="py-2.5 pr-4 font-bold uppercase tracking-wider">Calcium</th>
                            <th className="py-2 font-bold uppercase tracking-wider">Vit C</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uniqueExamples.map((ex, i) => (
                            <tr key={`${ex.food}-${i}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2.5 pr-4 font-body font-bold text-slate-800 dark:text-slate-200">{ex.food}</td>
                              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{ex.calories}</td>
                              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{ex.protein}</td>
                              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{ex.iron}</td>
                              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{ex.calcium}</td>
                              <td className="py-2 text-slate-600 dark:text-slate-300">{ex.vitamin_c}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card>
            )})}

            {nutrition.interaction_rules?.length > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <SectionEyebrow>Smart Food Pairings & Absorption</SectionEyebrow>
                <div className="space-y-3 mt-4">
                  {nutrition.interaction_rules.map((rule, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-4 transition-all ${
                        rule.type === "positive"
                          ? "bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-slate-900 dark:text-slate-100"
                          : "bg-rose-50/70 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          rule.type === "positive" ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800" : "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        }`}>
                          {rule.type === "positive" ? "Boosts Absorption" : "Avoid Pairing Together"}
                        </span>
                        <span className="text-xs font-bold font-data text-slate-700 dark:text-slate-300">
                          {rule.factors.join(" + ")}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">{rule.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">{rule.advice}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Link
              to="/recommendations"
              className="inline-block px-7 py-3.5 rounded-full bg-[#3AAE6F] text-white font-bold text-sm btn-green-primary shadow-md cursor-pointer"
            >
              See Your Personalized Plan →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-data">{value}</p>
    </div>
  );
}
