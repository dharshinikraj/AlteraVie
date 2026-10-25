import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Camera,
  Upload,
  ChevronDown,
  ChevronUp,
  Heart,
  FileText,
  Trash2,
  Utensils,
  BarChart2,
  AlertCircle,
  Plus,
  Stethoscope,
  ChevronRight,
  User,
  Edit3,
  Activity,
  Droplet,
  Moon,
} from "lucide-react";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";

export default function Dashboard() {
  const { user, token, profile } = useAssessment();
  const [assessments, setAssessments] = useState([]);
  const [reports, setReports] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for Collapsed Health Records Section
  const [recordsExpanded, setRecordsExpanded] = useState(false);
  
  // State for Selected Meal (tap to expand details)
  const [expandedMealId, setExpandedMealId] = useState(null);

  // File Upload & Manual Entry State inside Health Records
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualIron, setManualIron] = useState("");
  const [manualCalcium, setManualCalcium] = useState("");
  const [manualVitD, setManualVitD] = useState("");
  const [manualVitB12, setManualVitB12] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    Promise.all([
      api.getAssessmentsHistory().catch(() => []),
      api.getBloodReportsHistory().catch(() => []),
      api.getTodayFoodLogs().catch(() => []),
    ])
      .then(([assessmentsHistory, reportsHistory, foodLogsToday]) => {
        setAssessments(assessmentsHistory || []);
        setReports(reportsHistory || []);
        setFoodLogs(foodLogsToday || []);

        const latest = (assessmentsHistory && assessmentsHistory.length > 0)
          ? assessmentsHistory[0]
          : profile;

        if (latest?.age && latest?.height_cm && latest?.weight_kg && latest?.sleep_hours !== undefined && latest?.water_intake_l !== undefined) api
          .recommend({
            age: Number(latest.age),
            gender: latest.gender,
            height_cm: Number(latest.height_cm),
            weight_kg: Number(latest.weight_kg),
            activity_level: latest.activity_level,
            sleep_hours: Number(latest.sleep_hours),
            water_intake_l: Number(latest.water_intake_l),
            diet: latest.diet,
            fatigue: latest.symptom_fatigue || profile.fatigue || false,
            hair_loss: latest.symptom_hair_loss || profile.hair_loss || false,
            pale_skin: latest.symptom_pale_skin || profile.pale_skin || false,
            muscle_cramps: latest.symptom_muscle_cramps || profile.muscle_cramps || false,
            bone_pain: latest.symptom_bone_pain || profile.bone_pain || false,
            frequent_illness: latest.symptom_frequent_illness || profile.frequent_illness || false,
            brittle_nails: latest.symptom_brittle_nails || profile.brittle_nails || false,
            dizziness: latest.symptom_dizziness || profile.dizziness || false,
            numbness_tingling: latest.symptom_numbness_tingling || profile.numbness_tingling || false,
            slow_wound_healing: latest.symptom_slow_wound_healing || profile.slow_wound_healing || false,
            bleeding_gums: latest.symptom_bleeding_gums || profile.bleeding_gums || false,
            brain_fog: latest.symptom_brain_fog || profile.brain_fog || false,
            dry_skin: latest.symptom_dry_skin || profile.dry_skin || false,
            diabetes: latest.medical_diabetes || profile.diabetes || false,
            hypertension: latest.medical_hypertension || profile.hypertension || false,
            thyroid_disorder: latest.medical_thyroid_disorder || profile.thyroid_disorder || false,
            celiac_disease: latest.medical_celiac_disease || profile.celiac_disease || false,
            kidney_disease: latest.medical_kidney_disease || profile.kidney_disease || false,
            gastrointestinal_disorder: latest.medical_gastrointestinal_disorder || profile.gastrointestinal_disorder || false,
            fatty_liver: latest.medical_fatty_liver || profile.fatty_liver || false,
            osteoporosis: latest.medical_osteoporosis || profile.osteoporosis || false,
            anemia_history: latest.medical_anemia_history || profile.anemia_history || false,
            cardiovascular_disease: latest.medical_cardiovascular_disease || profile.cardiovascular_disease || false,
            levothyroxine: latest.medication_levothyroxine || profile.levothyroxine || false,
            warfarin: latest.medication_warfarin || profile.warfarin || false,
            metformin: latest.medication_metformin || profile.metformin || false,
            omeprazole: latest.medication_omeprazole || profile.omeprazole || false,
            statins: latest.medication_statins || profile.statins || false,
            diuretics: latest.medication_diuretics || profile.diuretics || false,
            corticosteroids: latest.medication_corticosteroids || profile.corticosteroids || false,
            cooking_method: latest.cooking_method || profile.cooking_method || "steamed",
            allergies: latest.allergies || profile.allergies || [],
            disliked_foods: latest.disliked_foods || profile.disliked_foods || [],
            cuisine_preference: latest.cuisine_preference || profile.cuisine_preference || "indian",
            user_location: latest.user_location || profile.user_location || "India - South",
            occupation: latest.occupation || profile.occupation || "Desk / Office Worker",
          })
          .then((res) => {
            if (res) {
              setMealPlan(res);
            }
          })
          .catch((err) => console.error("Meal plan fetch error:", err));
      })
      .catch((err) => console.error("Dashboard data load failed:", err))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  async function handleDeleteFoodLog(id, e) {
    e.stopPropagation();
    try {
      await api.deleteFoodLog(id);
      setFoodLogs((prev) => prev.filter((item) => item.id !== id));
      if (expandedMealId === id) setExpandedMealId(null);
    } catch (err) {
      alert(err.message || "Failed to delete food log entry.");
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadBloodReport(formData);
      setReports((prev) => [res, ...prev]);
    } catch (err) {
      setUploadError(err.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.recordManualReport({
        iron_level: manualIron ? Number(manualIron) : null,
        calcium_level: manualCalcium ? Number(manualCalcium) : null,
        vitamin_d_level: manualVitD ? Number(manualVitD) : null,
        vitamin_b12_level: manualVitB12 ? Number(manualVitB12) : null,
      });
      setReports((prev) => [res, ...prev]);
      setManualMode(false);
      setManualIron("");
      setManualCalcium("");
      setManualVitD("");
      setManualVitB12("");
    } catch (err) {
      alert(err.message || "Manual record failed.");
    }
  }

  if (loading) {
    return <CoachDashboardSkeleton />;
  }

  const latestAssessment = assessments[0] || null;
  const latestReport = reports[0] || null;
  const userName = user?.name || profile?.name || "Friend";

  // Calculate User Physical Details & BMI
  const age = latestAssessment?.age || profile?.age || "--";
  const gender = latestAssessment?.gender || profile?.gender || "--";
  const heightCm = latestAssessment?.height_cm || profile?.height_cm;
  const weightKg = latestAssessment?.weight_kg || profile?.weight_kg;
  const dietType = latestAssessment?.diet || profile?.diet || "vegetarian";
  const activityLevel = latestAssessment?.activity_level || profile?.activity_level || "moderate";
  const sleepHours = latestAssessment?.sleep_hours ?? profile?.sleep_hours ?? null;
  const waterIntake = latestAssessment?.water_intake_l ?? profile?.water_intake_l ?? null;

  let bmiVal = "--";
  let bmiCategory = "Normal";
  let bmiBadgeClass = "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200";

  if (heightCm && weightKg) {
    const bmiNum = Number(weightKg) / ((Number(heightCm) / 100) ** 2);
    bmiVal = bmiNum.toFixed(1);
    if (bmiNum < 18.5) {
      bmiCategory = "Underweight";
      bmiBadgeClass = "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200";
    } else if (bmiNum < 25) {
      bmiCategory = "Normal Weight";
      bmiBadgeClass = "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200";
    } else if (bmiNum < 30) {
      bmiCategory = "Overweight";
      bmiBadgeClass = "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200";
    } else {
      bmiCategory = "Obese";
      bmiBadgeClass = "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200";
    }
  }

  // Calculations for Today's Hero Progress Ring
  const totalCalories = Math.round((foodLogs || []).reduce((s, i) => s + (i?.calories || 0), 0));
  const totalProtein = Math.round((foodLogs || []).reduce((s, i) => s + (i?.protein_g || 0), 0));
  const targetCalories = mealPlan?.daily_meal_plan?.daily_totals?.calories || mealPlan?.daily_totals?.calories || mealPlan?.daily_nutrient_targets?.calories || null;
  const targetProtein = mealPlan?.daily_meal_plan?.daily_totals?.protein_g || mealPlan?.daily_totals?.protein_g || mealPlan?.daily_nutrient_targets?.protein_g || null;

  const calPercent = targetCalories ? Math.min(100, Math.max(0, Math.round((totalCalories / targetCalories) * 100))) : 0;
  const proteinPercent = targetProtein ? Math.min(100, Math.max(0, Math.round((totalProtein / targetProtein) * 100))) : 0;

  // Friendly Coach Greeting Message
  let coachMessage = `You're off to a wonderful start today, ${userName}! 🌿`;
  if (foodLogs.length === 0) {
    coachMessage = `Good day, ${userName}! Ready to nourish your body today? Tap below to scan your first meal.`;
  } else if (calPercent >= 80) {
    coachMessage = `Awesome work, ${userName}! You're right on target with your daily nutrition energy.`;
  } else {
    coachMessage = `You're ${proteinPercent}% toward your daily protein goal today — keep it up!`;
  }

  // Next Best Action Determination
  let nextAction = {
    title: "Scan your lunch plate",
    desc: "Snapping a quick photo helps calculate your daily protein & micronutrient balance.",
    cta: "Scan Meal with AI",
    link: "/food-vision",
    icon: <Camera className="w-5 h-5 text-[#3AAE6F]" />,
  };

  if (foodLogs.length === 0) {
    nextAction = {
      title: "Log your first meal of the day",
      desc: "Scan your breakfast or morning snack in 10 seconds with AI Food Vision.",
      cta: "Scan First Meal",
      link: "/food-vision",
      icon: <Camera className="w-5 h-5 text-[#3AAE6F]" />,
    };
  } else if (!latestReport) {
    nextAction = {
      title: "Add your recent blood test report",
      desc: "Uploading a lab report helps personalize your Vitamin D, Iron, and Calcium guidance.",
      cta: "Upload Lab Report",
      action: () => setRecordsExpanded(true),
      icon: <FileText className="w-5 h-5 text-[#D97757]" />,
    };
  } else if (latestAssessment) {
    nextAction = {
      title: "Explore your 3D recipe books",
      desc: "Discover daily and weekly meal plans customized to your local region and preferences.",
      cta: "Open Recipe Books",
      link: "/recommendations",
      icon: <Utensils className="w-5 h-5 text-[#3AAE6F]" />,
    };
  }

  // Consistent, friendly blood test status labels
  const labBiomarkers = [
    { name: "Iron / Ferritin", val: latestReport?.iron_level, unit: "ng/mL", low: 30, high: 200 },
    { name: "Calcium", val: latestReport?.calcium_level, unit: "mg/dL", low: 8.5, high: 10.5 },
    { name: "Vitamin D", val: latestReport?.vitamin_d_level, unit: "ng/mL", low: 20, high: 100 },
    { name: "Vitamin B12", val: latestReport?.vitamin_b12_level, unit: "pg/mL", low: 200, high: 900 },
  ];

  const hasHealthConcern =
    (latestReport && labBiomarkers.some((b) => typeof b.val === "number" && b.val < b.low)) ||
    (latestAssessment && (latestAssessment.medical_diabetes || latestAssessment.medical_hypertension || latestAssessment.medical_kidney_disease));

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-[#2D3748] dark:text-slate-100 transition-colors duration-300">
      {/* CONTAINER WITH 2 COMPONENTS PER ROW IN A GRID */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5 sm:space-y-6">

        {/* ======================================================== */}
        {/* ROW 1: TODAY'S HERO CARD (LEFT) + USER DETAILS (RIGHT)    */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Component 1: Today's Wellness Hero Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-[#EBE5DA] dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3AAE6F]/5 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#3AAE6F] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#F4B942]" />
                <span>Daily Wellness Companion</span>
              </div>

              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#2D3748] dark:text-slate-100">
                Good day, {userName}! 🌿
              </h1>

              <p className="text-xs text-[#5A6A80] dark:text-slate-300 leading-relaxed font-medium">
                {coachMessage}
              </p>
            </div>

            {/* Circular Progress Ring & Metrics */}
            <div className="mt-4 flex items-center justify-between gap-3 sm:gap-4 bg-[#FAF7F2] dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-[#EBE5DA] dark:border-slate-800">
              {/* Progress Ring SVG */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="7"
                    className="text-[#EBE5DA] dark:text-slate-700"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - calPercent / 100)}
                    strokeLinecap="round"
                    className="text-[#3AAE6F] transition-all duration-1000 ease-out"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-base font-extrabold text-[#2D3748] dark:text-slate-100">
                    {calPercent}%
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-[#5A6A80] dark:text-slate-400">
                    Energy Goal
                  </span>
                </div>
              </div>

              {/* Stat Summary */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-[#5A6A80] dark:text-slate-400">Calories</span>
                  <span className="font-bold text-[#2D3748] dark:text-slate-100 font-mono text-[11px]">
                    {totalCalories} / {targetCalories ?? "—"} kcal
                  </span>
                </div>
                <div className="w-full bg-[#EBE5DA] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#3AAE6F] h-full rounded-full transition-all duration-700" style={{ width: `${calPercent}%` }} />
                </div>

                <div className="flex justify-between items-baseline text-xs pt-0.5">
                  <span className="font-medium text-[#5A6A80] dark:text-slate-400">Protein</span>
                  <span className="font-bold text-[#3AAE6F] dark:text-emerald-400 font-mono text-[11px]">
                    {totalProtein} / {targetProtein ?? "—"} g
                  </span>
                </div>
                <div className="w-full bg-[#EBE5DA] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#D97757] h-full rounded-full transition-all duration-700" style={{ width: `${proteinPercent}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* Component 2: User Profile & Physical Intake Details Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-[#EBE5DA] dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#3AAE6F]/10 text-[#3AAE6F]">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#2D3748] dark:text-slate-100">
                    User Details & Profile
                  </h2>
                </div>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#3AAE6F] hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </Link>
              </div>

              {/* Grid of Key User Metrics */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-[#FAF7F2] dark:bg-slate-800 rounded-2xl border border-[#EBE5DA] dark:border-slate-700">
                  <span className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider">Age & Gender</span>
                  <p className="font-display font-bold text-sm text-[#2D3748] dark:text-slate-100 mt-0.5 capitalize">
                    {age} yrs · {gender}
                  </p>
                </div>

                <div className="p-3 bg-[#FAF7F2] dark:bg-slate-800 rounded-2xl border border-[#EBE5DA] dark:border-slate-700">
                  <span className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider">Height & Weight</span>
                  <p className="font-display font-bold text-sm text-[#2D3748] dark:text-slate-100 mt-0.5 font-mono">
                    {heightCm ? `${heightCm} cm` : "--"} · {weightKg ? `${weightKg} kg` : "--"}
                  </p>
                </div>

                <div className="p-3 bg-[#FAF7F2] dark:bg-slate-800 rounded-2xl border border-[#EBE5DA] dark:border-slate-700">
                  <span className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider">Body Mass Index</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-display font-bold text-sm text-[#2D3748] dark:text-slate-100 font-mono">{bmiVal}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${bmiBadgeClass}`}>
                      {bmiCategory}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] dark:bg-slate-800 rounded-2xl border border-[#EBE5DA] dark:border-slate-700">
                  <span className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider">Diet & Lifestyle</span>
                  <p className="font-display font-bold text-sm text-[#2D3748] dark:text-slate-100 mt-0.5 capitalize truncate">
                    {dietType} · {activityLevel}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Hydration & Sleep Pill */}
            <div className="mt-4 pt-3 border-t border-[#EBE5DA] dark:border-slate-800 flex items-center justify-between text-xs text-[#5A6A80] dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-sky-500" /> {waterIntake ?? "—"} L Water Intake
              </span>
              <span className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> {sleepHours ?? "—"} hrs Sleep
              </span>
            </div>
          </section>
        </div>

        {/* ======================================================== */}
        {/* ROW 2: NEXT BEST ACTION (LEFT) + HEALTH PROMPT (RIGHT)   */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Component 3: Next Best Action Coach Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-[#EBE5DA] dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-[#DCEBD8]/60 dark:bg-slate-800 shrink-0">
                {nextAction.icon}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3AAE6F]">
                  Suggested Next Action
                </span>
                <h3 className="font-display font-bold text-base text-[#2D3748] dark:text-slate-100 mt-0.5">
                  {nextAction.title}
                </h3>
                <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1 leading-snug">
                  {nextAction.desc}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EBE5DA] dark:border-slate-800 flex justify-end">
              {nextAction.link ? (
                <Link
                  to={nextAction.link}
                  className="px-4 py-2 rounded-full bg-[#3AAE6F] hover:bg-[#339961] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{nextAction.cta}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  onClick={nextAction.action}
                  className="px-4 py-2 rounded-full bg-[#D97757] hover:bg-[#c66446] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{nextAction.cta}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Component 4: Professional Medical Guidance Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-[#EBE5DA] dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Medical & Clinical Guidance
                </span>
                <h4 className="font-display font-bold text-base text-[#2D3748] dark:text-slate-100">
                  {hasHealthConcern ? "Gentle Medical Note" : "Verified Doctor Network"}
                </h4>
                <p className="text-xs text-[#5A6A80] dark:text-slate-400 leading-relaxed">
                  {hasHealthConcern
                    ? "Based on your active health profile and blood test markers, nutrition works best alongside medical oversight. Consult a registered dietitian."
                    : "Access 23 verified clinical dietitians and medical nutritionists across South India with instant Leaflet map directions."}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EBE5DA] dark:border-slate-800 flex justify-end">
              <Link
                to="/doctors"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
              >
                <span>Find Nearby Doctors →</span>
              </Link>
            </div>
          </section>
        </div>

        {/* ======================================================== */}
        {/* ROW 3: TODAY'S MEALS (LEFT) + HEALTH RECORDS (RIGHT)     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Component 5: Today's Meals Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-[#EBE5DA] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#3AAE6F]/10 text-[#3AAE6F]">
                  <Utensils className="w-4 h-4" />
                </div>
                <h2 className="font-display text-lg font-bold text-[#2D3748] dark:text-slate-100">
                  Today's Meals
                </h2>
              </div>
              <Link
                to="/food-vision"
                className="text-xs font-bold text-[#3AAE6F] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Scan Meal
              </Link>
            </div>
            
            <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1 mb-2">
              <AlertCircle className="w-3 h-3 inline-block mr-1 -mt-0.5 opacity-70" />
              Food logs are tracked independently of your baseline health profile.
            </p>

            {foodLogs.length === 0 ? (
              /* Actionable Empty State */
              <div className="p-5 bg-[#FAF7F2] dark:bg-slate-800/60 rounded-2xl text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DCEBD8]/60 dark:bg-slate-800 text-[#3AAE6F] grid place-items-center mx-auto">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#2D3748] dark:text-slate-100">
                    Nothing logged yet today
                  </h3>
                  <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-0.5 leading-relaxed">
                    Scan your first meal in 10 seconds with AI Food Vision to see your daily nutrient progress.
                  </p>
                </div>
                <Link
                  to="/food-vision"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3AAE6F] text-white font-bold text-xs shadow-xs hover:bg-[#339961] transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan Plate with AI</span>
                </Link>
              </div>
            ) : (
              /* Meal Log Stack */
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {foodLogs.map((log) => {
                  const isExpanded = expandedMealId === log.id;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setExpandedMealId(isExpanded ? null : log.id)}
                      className="bg-[#FAF7F2] dark:bg-slate-800 rounded-2xl p-3.5 border border-[#EBE5DA] dark:border-slate-700 cursor-pointer hover:border-[#3AAE6F]/50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🍲</span>
                          <div>
                            <h4 className="font-display font-bold text-sm text-[#2D3748] dark:text-slate-100 capitalize">
                              {log.dish_name}
                            </h4>
                            <p className="text-xs text-[#5A6A80] dark:text-slate-400">
                              {log.portion_multiplier || 1.0}× portion · {Math.round(log.calories)} kcal
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3AAE6F] bg-[#DCEBD8]/60 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          +{Math.round(log.protein_g || 14)}g Protein
                        </span>
                      </div>

                      {/* Tap for micro details */}
                      <div className="flex items-center justify-between text-[11px] text-[#5A6A80] dark:text-slate-400 pt-1 font-medium border-t border-[#EBE5DA]/60 dark:border-slate-700/60">
                        <span>{isExpanded ? "Hide details" : "Tap for details"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>

                      {/* Detailed Breakdown */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-[#EBE5DA] dark:border-slate-700 space-y-1.5 text-xs text-[#2D3748] dark:text-slate-200 font-data">
                          <div className="flex justify-between">
                            <span>Iron:</span>
                            <span className="font-bold">{log.iron_mg || 0} mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Calcium:</span>
                            <span className="font-bold">{log.calcium_mg || 0} mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Carbohydrates:</span>
                            <span className="font-bold">{log.carbs_g || 0} g</span>
                          </div>
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={(e) => handleDeleteFoodLog(log.id, e)}
                              className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove Log
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Component 6: Collapsed / Expandable Health Records Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EBE5DA] dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
            {/* Header Bar */}
            <div
              onClick={() => setRecordsExpanded(!recordsExpanded)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F2]/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#D97757]/10 text-[#D97757]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#2D3748] dark:text-slate-100">
                    Health Records & Lab Reports
                  </h3>
                  <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-0.5">
                    {reports.length > 0
                      ? `${reports.length} Blood Report(s) · ${assessments.length} Assessment(s)`
                      : "No blood test reports uploaded yet"}
                  </p>
                </div>
              </div>

              <button className="p-2 rounded-full bg-[#FAF7F2] dark:bg-slate-800 text-[#2D3748] dark:text-slate-200">
                {recordsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expanded Content Area */}
            {recordsExpanded && (
              <div className="p-5 pt-0 border-t border-[#EBE5DA] dark:border-slate-800 space-y-5">
                
                {/* Consistent Blood Biomarker List */}
                <div className="space-y-3 pt-4">
                  <span className="text-xs font-bold text-[#2D3748] dark:text-slate-200 uppercase tracking-wider block">
                    Latest Lab Values:
                  </span>
                  
                  {latestReport ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {labBiomarkers.map((b) => {
                        let statusLabel = "Normal";
                        let statusStyle = "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200";
                        
                        if (typeof b.val === "number") {
                          if (b.val < b.low) {
                            statusLabel = "Low";
                            statusStyle = "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200";
                          } else if (b.val > b.high) {
                            statusLabel = "High";
                            statusStyle = "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200";
                          }
                        }

                        return (
                          <div key={b.name} className="p-2.5 bg-[#FAF7F2] dark:bg-slate-800 rounded-xl border border-[#EBE5DA] dark:border-slate-700 flex flex-col justify-between">
                            <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-medium">{b.name}</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="font-display font-bold text-xs text-[#2D3748] dark:text-slate-100">
                                {typeof b.val === "number" ? `${b.val} ${b.unit}` : "N/A"}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${statusStyle}`}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5A6A80] dark:text-slate-400 italic">
                      Upload a PDF or image of your blood test to populate biomarker values.
                    </p>
                  )}
                </div>

                {/* Upload Dropzone */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#2D3748] dark:text-slate-200 uppercase tracking-wider block">
                    Upload New Report File:
                  </span>
                  <div className="border-2 border-dashed border-[#EBE5DA] dark:border-slate-700 hover:border-[#3AAE6F] bg-[#FAF7F2]/50 dark:bg-slate-800/40 rounded-2xl p-4 text-center transition-all relative cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.pdf,.csv,.png,.jpg,.jpeg,.webp"
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1 pointer-events-none">
                      <BarChart2 className="w-5 h-5 text-[#3AAE6F] mx-auto" />
                      <p className="text-xs font-bold text-[#2D3748] dark:text-slate-200">
                        {uploading ? "Reading test values..." : "Click or drag report file here"}
                      </p>
                      <p className="text-[10px] text-[#5A6A80] dark:text-slate-400">PDF, TXT, PNG, JPG formats</p>
                    </div>
                  </div>
                  {uploadError && <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>}
                </div>

                {/* Manual Entry Toggle */}
                <div>
                  <button
                    onClick={() => setManualMode(!manualMode)}
                    className="text-xs font-bold text-[#3AAE6F] hover:underline cursor-pointer"
                  >
                    {manualMode ? "Cancel manual input" : "+ Enter test numbers manually"}
                  </button>

                  {manualMode && (
                    <form onSubmit={handleManualSubmit} className="mt-3 p-3.5 bg-[#FAF7F2] dark:bg-slate-800 rounded-2xl border border-[#EBE5DA] dark:border-slate-700 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block font-medium mb-1">Iron (ng/mL)</label>
                          <input type="number" step="0.1" value={manualIron} onChange={(e) => setManualIron(e.target.value)} placeholder="15.4" className="w-full p-2 rounded-xl border border-[#EBE5DA] dark:border-slate-700 bg-white dark:bg-slate-900" />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Calcium (mg/dL)</label>
                          <input type="number" step="0.1" value={manualCalcium} onChange={(e) => setManualCalcium(e.target.value)} placeholder="8.2" className="w-full p-2 rounded-xl border border-[#EBE5DA] dark:border-slate-700 bg-white dark:bg-slate-900" />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Vit D (ng/mL)</label>
                          <input type="number" step="0.1" value={manualVitD} onChange={(e) => setManualVitD(e.target.value)} placeholder="18" className="w-full p-2 rounded-xl border border-[#EBE5DA] dark:border-slate-700 bg-white dark:bg-slate-900" />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Vit B12 (pg/mL)</label>
                          <input type="number" step="0.1" value={manualVitB12} onChange={(e) => setManualVitB12(e.target.value)} placeholder="150" className="w-full p-2 rounded-xl border border-[#EBE5DA] dark:border-slate-700 bg-white dark:bg-slate-900" />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-2 bg-[#3AAE6F] text-white text-xs font-bold rounded-xl hover:bg-[#339961]">
                        Save Test Values
                      </button>
                    </form>
                  )}
                </div>

                {/* Assessment History */}
                {assessments.length > 0 && (
                  <div className="pt-3 border-t border-[#EBE5DA] dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-[#2D3748] dark:text-slate-200 uppercase tracking-wider block">
                      Completed Assessments:
                    </span>
                    <div className="space-y-1.5">
                      {assessments.map((a, idx) => (
                        <div key={a.id} className="flex justify-between items-center text-xs p-2.5 bg-[#FAF7F2] dark:bg-slate-800 rounded-xl">
                          <span className="font-bold text-[#2D3748] dark:text-slate-200">
                            Assessment #{assessments.length - idx} ({a.diet})
                          </span>
                          <span className="text-[#5A6A80] dark:text-slate-400 text-[11px]">
                            {new Date(a.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>


      </main>
    </div>
  );
}

function CoachDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 p-6 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
          <div className="h-48 bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
          <div className="h-32 bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
