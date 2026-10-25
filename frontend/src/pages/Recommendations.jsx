import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, SectionEyebrow, NutrientCard } from "../components/Cards";
import InteractiveMealBooks from "../components/InteractiveMealBooks";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";

export default function Recommendations() {
  const { profile, recommendation, setRecommendation, reset } = useAssessment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile.name) {
      navigate("/profile");
      return;
    }
    if (recommendation) return;

    setLoading(true);
    setError(null);

    api
      .recommend({
        age: Number(profile.age),
        gender: profile.gender,
        height_cm: Number(profile.height_cm),
        weight_kg: Number(profile.weight_kg),
        activity_level: profile.activity_level,
        sleep_hours: Number(profile.sleep_hours),
        water_intake_l: Number(profile.water_intake_l),
        diet: profile.diet,
        fatigue: !!profile.fatigue,
        hair_loss: !!profile.hair_loss,
        pale_skin: !!profile.pale_skin,
        muscle_cramps: !!profile.muscle_cramps,
        bone_pain: !!profile.bone_pain,
        frequent_illness: !!profile.frequent_illness,
        brittle_nails: !!profile.brittle_nails,
        dizziness: !!profile.dizziness,
        numbness_tingling: !!profile.numbness_tingling,
        slow_wound_healing: !!profile.slow_wound_healing,
        bleeding_gums: !!profile.bleeding_gums,
        brain_fog: !!profile.brain_fog,
        dry_skin: !!profile.dry_skin,
        diabetes: !!profile.diabetes,
        hypertension: !!profile.hypertension,
        thyroid_disorder: !!profile.thyroid_disorder,
        celiac_disease: !!profile.celiac_disease,
        kidney_disease: !!profile.kidney_disease,
        gastrointestinal_disorder: !!profile.gastrointestinal_disorder,
        fatty_liver: !!profile.fatty_liver,
        osteoporosis: !!profile.osteoporosis,
        anemia_history: !!profile.anemia_history,
        cardiovascular_disease: !!profile.cardiovascular_disease,
        levothyroxine: !!profile.levothyroxine,
        warfarin: !!profile.warfarin,
        metformin: !!profile.metformin,
        omeprazole: !!profile.omeprazole,
        statins: !!profile.statins,
        diuretics: !!profile.diuretics,
        corticosteroids: !!profile.corticosteroids,
        cooking_method: profile.cooking_method,
        allergies: profile.allergies || [],
        disliked_foods: Array.isArray(profile.disliked_foods) ? profile.disliked_foods : (profile.disliked_foods || "").split(",").map((s) => s.trim()).filter(Boolean),
        cuisine_preference: profile.cuisine_preference || "indian",
        user_location: profile.user_location || "India - South",
        occupation: profile.occupation || "Desk / Office Worker",
      })
      .then(setRecommendation)
      .catch((err) => setError(err.message || "Recommendation generation failed."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.name]);

  function handleRestart() {
    reset();
    navigate("/");
  }

  const mealPlan = recommendation?.daily_meal_plan;
  const meals = mealPlan?.meals || {};
  const activeAllergies = mealPlan?.active_allergy_filters || profile.allergies || [];
  const activeDislikes = mealPlan?.active_dislike_filters || profile.disliked_foods || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <div>
        <SectionEyebrow>Step 4 · Personalized Recommendations</SectionEyebrow>
        <h1 className="font-display text-3xl text-ink dark:text-slate-100 mb-2">Your Personalized Health & Meal Plan</h1>

        {loading && (
          <Card className="animate-pulse mt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 bg-mist-100 dark:bg-slate-800 rounded-full" />
              ))}
            </div>
          </Card>
        )}
        {error && (
          <Card className="border-clay-400/40 dark:border-rose-900 bg-clay-100/40 dark:bg-rose-950/40 mt-6">
            <p className="text-sm text-clay-500 dark:text-rose-300">{error}</p>
          </Card>
        )}

        {recommendation && !loading && (
          <>
            <p className="text-ink-soft dark:text-slate-300 mb-6">{recommendation.summary}</p>

            {(activeAllergies.length > 0 || activeDislikes.length > 0) && (
              <div className="bg-paper dark:bg-slate-900 border border-mist-300/80 dark:border-slate-800 rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-soft dark:text-slate-400 uppercase tracking-wider mr-1">Active Safety Filters:</span>
                {activeAllergies.map((alg) => (
                  <span key={alg} className="inline-flex items-center gap-1 bg-emerald-500/10 text-forest-600 dark:text-emerald-300 border border-forest-500/20 dark:border-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    {alg.toUpperCase()} FREE
                  </span>
                ))}
                {activeDislikes.map((dis) => (
                  <span key={dis} className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    EXCLUDED: {dis}
                  </span>
                ))}
              </div>
            )}

            {recommendation.drug_safety_warnings?.length > 0 && (
              <div className="space-y-4 mb-8">
                {recommendation.drug_safety_warnings.map((warning, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border p-5 flex gap-4 items-start shadow-xs transition-all duration-300 ${
                      warning.severity === "Critical"
                        ? "bg-clay-100/50 dark:bg-rose-950/50 border-clay-400/35 dark:border-rose-900 text-ink dark:text-slate-100"
                        : warning.severity === "Warning"
                        ? "bg-amber-100/50 dark:bg-amber-950/50 border-amber-400/35 dark:border-amber-900 text-ink dark:text-slate-100"
                        : "bg-mist-100/50 dark:bg-slate-800/50 border-mist-300/35 dark:border-slate-700 text-ink-soft dark:text-slate-300"
                    }`}
                  >
                    <div className="mt-0.5">
                      {warning.severity === "Critical" ? (
                        <svg className="w-5 h-5 text-clay-500 dark:text-rose-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      ) : warning.severity === "Warning" ? (
                        <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-ink-soft dark:text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-base mb-1 text-ink dark:text-slate-100">
                        Medication Alert: {warning.medication}
                      </h4>
                      <p className="text-sm text-ink-soft dark:text-slate-300 mb-2 leading-relaxed">
                        {warning.description}
                      </p>
                      <p className="text-sm text-ink dark:text-slate-100 font-semibold flex items-start gap-1">
                        <span className="text-xs uppercase tracking-wider text-ink-soft dark:text-slate-400">Advice:</span>
                        <span className="italic font-normal">{warning.advice}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* INTERACTIVE DUAL MEAL BOOKS SECTION */}
            <InteractiveMealBooks
              recommendation={recommendation}
              userLocation={profile.user_location}
              cuisinePreference={profile.cuisine_preference}
            />

            <Card className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink dark:text-slate-100">Not sure what to cook?</p>
                <p className="text-sm text-ink-soft dark:text-slate-300">Enter the ingredients you have at home and get meals matched to your nutrient gaps.</p>
              </div>
              <Link to="/pantry" className="px-5 py-2.5 rounded-full bg-[#3AAE6F] text-white font-semibold text-sm">Cook with my pantry</Link>
            </Card>

            <SectionEyebrow>Nutrient Deficiency Focus</SectionEyebrow>
            <h2 className="font-display text-2xl text-ink dark:text-slate-100 mb-4">Targeted Food & Cooking Guidance</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              {recommendation.detailed_recommendations.map((rec) => (
                <NutrientCard
                  key={rec.nutrient}
                  nutrient={rec.nutrient}
                  riskLevel={rec.risk_level}
                  foods={rec.recommended_foods}
                  cookingTip={rec.cooking_suggestion}
                  avoid={rec.foods_to_avoid_or_time_carefully}
                  lifestyleTip={rec.lifestyle_advice}
                />
              ))}
            </div>

            {recommendation.relevant_nutrient_interactions?.length > 0 && (
              <Card className="mt-8">
                <SectionEyebrow>Keep in mind</SectionEyebrow>
                <div className="space-y-3 mt-3">
                  {recommendation.relevant_nutrient_interactions.map((rule, i) => (
                    <p key={i} className="text-sm text-ink-soft dark:text-slate-300">
                      <span className="text-ink dark:text-slate-100 font-medium">
                        {rule.factors.join(" + ")}:
                      </span>{" "}
                      {rule.advice}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            <button
              onClick={handleRestart}
              className="inline-block mt-10 px-6 py-3 rounded-full border border-mist-300 dark:border-slate-700 text-ink dark:text-slate-200 font-semibold text-sm hover:border-forest-400 transition-colors"
            >
              Start a new assessment
            </button>
          </>
        )}
      </div>
    </div>
  );
}
