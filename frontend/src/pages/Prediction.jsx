import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Card, SectionEyebrow } from "../components/Cards";
import { ProbabilityGroup } from "../components/ProgressBars";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";

export default function Prediction() {
  const { profile, prediction, setPrediction } = useAssessment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile.name) {
      navigate("/profile");
      return;
    }
    if (prediction) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .predict(buildPredictPayload(profile))
      .then((res) => {
        if (!cancelled) setPrediction(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Prediction failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.name]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col lg:flex-row gap-6 lg:gap-10 overflow-hidden">
      <Sidebar activeKey="prediction" completedKeys={["profile"]} />

      <div className="flex-1 w-full min-w-0 max-w-2xl">
        <SectionEyebrow>Step 2 · Your Health Need Results</SectionEyebrow>
        <h1 className="font-display text-3xl text-ink dark:text-slate-100 mb-2">
          Nutrient focus for {profile.name || "you"}
        </h1>
        <p className="text-ink-soft dark:text-slate-300 mb-8">
          Population-level screening estimates from the trained NHANES model. These are not a diagnosis; measured laboratory values and clinician interpretation take priority.
        </p>

        {loading && <LoadingCard />}
        {error && <ErrorCard message={error} />}

        {prediction && !loading && (
          <>
            <Card>
              <ProbabilityGroup predictions={prediction.predictions} />
            </Card>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-soft dark:text-slate-400 mr-1">Main Focus Areas:</span>
              {prediction.top_deficiencies.length === 0 ? (
                <span className="text-sm text-forest-500 dark:text-emerald-400 font-semibold">
                  All good — low overall deficiency risk!
                </span>
              ) : (
                prediction.top_deficiencies.map((n) => (
                  <span
                    key={n}
                    className="text-xs font-data uppercase tracking-wide px-2.5 py-1 rounded-full bg-clay-100 dark:bg-rose-950/60 text-clay-500 dark:text-rose-300 border border-clay-400/30 dark:border-rose-900"
                  >
                    {n}
                  </span>
                ))
              )}
            </div>

            <Link
              to="/nutrition"
              className="inline-block mt-8 px-6 py-3 rounded-full bg-[#3AAE6F] text-white font-bold text-sm btn-green-primary"
            >
              See Cooking & Food Science Tips →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export function buildPredictPayload(profile) {
  return {
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
  };
}

function LoadingCard() {
  return (
    <Card className="animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-3 bg-mist-100 dark:bg-slate-800 rounded-full" />
        ))}
      </div>
    </Card>
  );
}

function ErrorCard({ message }) {
  return (
    <Card className="border-clay-400/40 dark:border-rose-900 bg-clay-100/40 dark:bg-rose-950/40">
      <p className="text-sm text-clay-500 dark:text-rose-300">
        Couldn't reach the prediction service: {message}. Make sure the
        backend is running at the configured API URL.
      </p>
    </Card>
  );
}
