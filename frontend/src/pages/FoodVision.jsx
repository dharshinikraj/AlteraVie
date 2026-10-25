import { useState, useEffect, useRef, useCallback } from "react";
import { Card, SectionEyebrow } from "../components/Cards";
import { api } from "../api/client";
import { useAssessment } from "../context/AssessmentContext";
import { Camera, Upload, RefreshCw, X, Sparkles, Check, Database } from "lucide-react";

const NUTRIENT_COLORS = {
  calories: { label: "Calories", unit: "kcal", color: "from-amber-400 to-orange-500", max: 800 },
  protein: { label: "Protein", unit: "g", color: "from-emerald-400 to-teal-600", max: 60 },
  fat: { label: "Fat", unit: "g", color: "from-rose-400 to-pink-500", max: 80 },
  carbs: { label: "Carbs", unit: "g", color: "from-indigo-400 to-blue-600", max: 100 },
  fiber: { label: "Fiber", unit: "g", color: "from-emerald-500 to-green-700", max: 20 },
  iron: { label: "Iron", unit: "mg", color: "from-rose-500 to-red-700", max: 18 },
  calcium: { label: "Calcium", unit: "mg", color: "from-teal-400 to-cyan-600", max: 1000 },
  vitamin_d: { label: "Vitamin D", unit: "IU", color: "from-amber-500 to-yellow-600", max: 600 },
  vitamin_b12: { label: "Vitamin B12", unit: "µg", color: "from-purple-400 to-indigo-600", max: 2.4 },
  vitamin_c: { label: "Vitamin C", unit: "mg", color: "from-orange-400 to-amber-500", max: 90 },
};

function getNutrientValue(nutrients, key) {
  if (!nutrients) return undefined;
  if (nutrients[key] !== undefined) return nutrients[key];
  const aliasMap = {
    protein: ["protein_g"],
    fat: ["fat_g"],
    carbs: ["carbohydrates_g", "carbs_g"],
    fiber: ["fiber_g"],
    iron: ["iron_mg"],
    calcium: ["calcium_mg"],
    vitamin_d: ["vitamin_d_iu", "vitamin_d_mcg"],
    vitamin_b12: ["vitamin_b12_mcg"],
    vitamin_c: ["vitamin_c_mg"],
  };
  const aliases = aliasMap[key] || [];
  for (const alias of aliases) {
    if (nutrients[alias] !== undefined) return nutrients[alias];
  }
  return undefined;
}

function getCategoryBadgeClass(category) {
  if (!category) return "bg-slate-100 text-slate-600 border-slate-200";
  const cat = category.toLowerCase();
  if (cat === "low") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (cat === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export default function FoodVision() {
  const { recommendation } = useAssessment();
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "camera"
  const [dragging, setDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [portion, setPortion] = useState(1.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loggedMessage, setLoggedMessage] = useState(null);
  const [loggingMeal, setLoggingMeal] = useState(false);
  
  // Live Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Daily Summary State
  const [dailySummary, setDailySummary] = useState(null);
  const inputRef = useRef(null);

  // Load daily summary on mount
  useEffect(() => {
    fetchDailySummary();
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      mediaStreamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable on this device. Please use photo upload mode.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `food_scan_${Date.now()}.jpg`, { type: "image/jpeg" });
      const dataUrl = canvas.toDataURL("image/jpeg");
      setImagePreview(dataUrl);
      setImageFile(file);
      setResult(null);
      setLoggedMessage(null);
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  // Attach stream when cameraActive turns true
  useEffect(() => {
    if (cameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function fetchDailySummary() {
    try {
      const summary = await api.getTodayNutritionSummary();
      setDailySummary(summary);
    } catch {
      /* User might not be logged in */
    }
  }

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    setError(null);
    setResult(null);
    setLoggedMessage(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleInputChange(e) {
    handleFile(e.target.files[0]);
  }

  function handleImageUpload(e) {
    if (e.target?.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  }

  async function handleAnalyze() {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setLoggedMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const data = await api.predictFoodVision(formData, portion);
      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogMeal() {
    if (!result) return;
    setLoggingMeal(true);
    try {
      const dishName = (result.predicted_dish || result.dish_name || "Food Item").replace(/_/g, " ");
      const nutrientsObj = result.total_nutrients || result.nutrients || {};
      const calories = getNutrientValue(nutrientsObj, "calories") || 0;
      const protein = getNutrientValue(nutrientsObj, "protein") || 0;
      const fat = getNutrientValue(nutrientsObj, "fat") || 0;
      const carbs = getNutrientValue(nutrientsObj, "carbs") || 0;

      await api.logFoodMeal({
        dish_name: dishName,
        portion_multiplier: portion,
        estimated_weight_g: result.estimated_total_weight_g || 0,
        calories: Number(calories),
        protein_g: Number(protein),
        fat_g: Number(fat),
        carbs_g: Number(carbs),
        gi: result.gi,
        gl: result.gl,
        available_carbs_g: result.available_carbs_g,
      });

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Check if logged dish matches planned meals in recommendation
      let matchesPlan = false;
      const mealsObj = recommendation?.daily_meal_plan?.meals;
      if (mealsObj) {
        const plannedMeals = Object.values(mealsObj).filter(Boolean);
        const loggedLower = dishName.toLowerCase();

        matchesPlan = plannedMeals.some((meal) => {
          const mealNameLower = (meal.name || "").toLowerCase();
          const ingredientsStr = (meal.ingredients || []).join(" ").toLowerCase();
          if (loggedLower.includes(mealNameLower) || mealNameLower.includes(loggedLower)) return true;
          const loggedWords = loggedLower.split(/\s+/).filter((w) => w.length > 2);
          const mealWords = `${mealNameLower} ${ingredientsStr}`.split(/\s+/).filter((w) => w.length > 2);
          return loggedWords.some((w) => mealWords.includes(w));
        });
      }

      if (matchesPlan) {
        setLoggedMessage({
          isMatch: true,
          title: "Meal Plan Match! 🎉",
          text: `Logged at ${nowStr}. Outstanding job sticking to your planned daily menu! You're building healthy habits.`,
        });
      } else {
        setLoggedMessage({
          isMatch: false,
          title: "Logged to Daily Journal 🌿",
          text: `Logged at ${nowStr}. Not on your planned menu today? That's completely fine — consistency beats perfection! Aim for a high-protein, nutrient-dense choice for your next meal to stay on track. 💪`,
        });
      }

      fetchDailySummary();
    } catch (err) {
      const isAuthErr = err.message?.includes("authentication") || err.message?.includes("session token") || err.message?.includes("401");
      const msg = isAuthErr
        ? "Please log in to save meals to your daily journal."
        : (err.message || "Failed to log meal to food journal.");
      alert(msg);
    } finally {
      setLoggingMeal(false);
    }
  }

  function handleReset() {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setLoggedMessage(null);
    setPortion(1.0);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-7">
      {/* Header */}
      <section className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.16em] font-extrabold text-emerald-600 dark:text-emerald-300">Food Vision</p>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-950 dark:text-white mt-1">Scan your meal</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl leading-relaxed">
              Take a photo or choose one from your gallery. AlteraVie identifies the dish, then resolves nutrient data from a live food source.
            </p>
          </div>
          <span className="source-pill hidden sm:inline-flex"><Database className="w-3.5 h-3.5" /> USDA nutrition</span>
        </div>
      </section>

      {/* Today's Daily Glycemic & Nutrition Journal Bar */}
      {dailySummary && dailySummary.entry_count > 0 && (
        <Card className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-none shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div>
              <span className="text-[10px] font-bold font-data text-emerald-400 uppercase tracking-wider">Today's Food Journal</span>
              <h3 className="font-display text-lg font-bold text-white mt-0.5">
                {dailySummary.entry_count} Meals Logged Today
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-data text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Calories</span>
                <span className="font-bold text-white text-sm">{Math.round(dailySummary.total_calories)} kcal</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Carbs</span>
                <span className="font-bold text-white text-sm">{dailySummary.total_carbs_g.toFixed(1)}g</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Average GI</span>
                <span className="font-bold text-emerald-300 text-sm">
                  {dailySummary.average_gi !== null ? dailySummary.average_gi : "N/A"}
                  {dailySummary.average_gi_category && (
                    <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {dailySummary.average_gi_category}
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Glycemic Load</span>
                <span className="font-bold text-amber-300 text-sm">
                  {dailySummary.total_gl !== null ? dailySummary.total_gl : "N/A"}
                  {dailySummary.total_gl_category && (
                    <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(dailySummary.total_gl_category)}`}>
                      {dailySummary.total_gl_category} GL
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-5 sm:gap-7 items-start">
        {/* Left: Upload + Live Camera controls */}
        <div className="space-y-4">

          {/* Mode Switcher Bar */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <button
              type="button"
              onClick={() => { setInputMode("upload"); stopCamera(); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                inputMode === "upload"
                  ? "bg-white dark:bg-slate-900 text-[#3AAE6F] shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => { setInputMode("camera"); startCamera(); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                inputMode === "camera"
                  ? "bg-[#3AAE6F] text-white shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </button>
          </div>

          {/* Container area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !imagePreview && inputMode === "upload" && inputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
              inputMode === "upload" && !imagePreview ? "cursor-pointer" : "cursor-default"
            }
              ${dragging ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]" : "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:border-emerald-400"}
              ${imagePreview || inputMode === "camera" ? "border-solid border-slate-200 dark:border-slate-700" : ""}
            `}
            style={{ minHeight: "300px" }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleInputChange}
            />

            <input
              id="native-camera-fallback"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />

            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-full object-cover rounded-2xl shadow-inner"
                  style={{ maxHeight: "340px" }}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md cursor-pointer"
                  title="Retake or choose another photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : inputMode === "camera" ? (
              <div className="relative w-full h-[320px] bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                {cameraActive ? (
                  <>
                    <video
                      ref={(node) => {
                        videoRef.current = node;
                        if (node && mediaStreamRef.current && node.srcObject !== mediaStreamRef.current) {
                          node.srcObject = mediaStreamRef.current;
                          node.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Glowing HUD Target Overlay */}
                    <div className="absolute inset-8 border-2 border-emerald-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                      <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                      <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                      <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur">
                        Position Meal in Frame
                      </span>
                    </div>

                    {/* Snap Shutter Button */}
                    <button
                      type="button"
                      onClick={captureCameraPhoto}
                      className="absolute bottom-4 px-6 py-2.5 rounded-full bg-[#3AAE6F] hover:bg-[#339961] text-white font-bold text-xs shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Photo</span>
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <Camera className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-medium">
                      {cameraError || "WebRTC camera access restricted or unavailable."}
                    </p>
                    <button
                      type="button"
                      onClick={() => document.getElementById("native-camera-fallback")?.click()}
                      className="px-5 py-2.5 bg-[#3AAE6F] hover:bg-[#278657] text-white rounded-full text-xs font-extrabold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Native Camera</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4 text-[#3AAE6F] shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Drop a meal photo here</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">or click to browse — JPG, PNG, WEBP</p>
                <p className="text-[11px] text-slate-400/80 dark:text-slate-500/80 mt-3 font-data">Nutrient values are looked up from live food data after recognition</p>
              </div>
            )}
          </div>

          {/* Portion multiplier */}
          {imagePreview && (
            <Card>
              <SectionEyebrow>Portion Size</SectionEyebrow>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">Serving multiplier</span>
                  <span className="font-data text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ×{portion.toFixed(1)}
                  </span>
                </div>
                <input
                  id="portion-slider"
                  type="range"
                  min="0.25"
                  max="3.0"
                  step="0.25"
                  value={portion}
                  onChange={(e) => setPortion(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-data font-semibold">
                  <span>¼</span>
                  <span>½</span>
                  <span>1×</span>
                  <span>2×</span>
                  <span>3×</span>
                </div>
              </div>
            </Card>
          )}

          {/* Analyze button */}
          {imagePreview && (
            <button
              id="analyze-food-btn"
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#3AAE6F] text-white font-extrabold text-sm shadow-sm hover:bg-[#278657] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysing dish & GI profile...
                </span>
              ) : "Analyse Plate & Glycemic Impact"}
            </button>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {!result && !loading && (
            <Card className="text-center py-20 border-2 border-dashed border-slate-200 bg-slate-50/40">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <p className="text-sm font-bold text-slate-800">Nutrient & GI breakdown appears here</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                Upload a photo of your meal and click Analyse to get a full macro, micro, and Glycemic Load breakdown.
              </p>
            </Card>
          )}

          {loading && (
            <Card className="space-y-4 py-10">
              <div className="h-5 shimmer-bg rounded-full w-1/2 mx-auto" />
              <div className="h-3 shimmer-bg rounded-full w-3/4 mx-auto" />
              <div className="space-y-3 mt-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 shimmer-bg rounded-full w-24" />
                    <div className="flex-1 h-2 shimmer-bg rounded-full" />
                    <div className="h-3 shimmer-bg rounded-full w-12" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result && (
            <>
              {/* Dish identity card */}
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionEyebrow>Dish Identified</SectionEyebrow>
                    <h2 className="font-display text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 font-bold capitalize mt-1">
                      {(result.predicted_dish || result.dish_name || "").replace(/_/g, " ")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      Confidence Score: <span className="font-data font-bold text-slate-900 dark:text-slate-100">{(result.confidence * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                  <span className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-data text-xs font-bold uppercase max-w-[140px] truncate">
                    {result.cooking_method || `${result.estimated_total_weight_g || 0}g serving`}
                  </span>
                </div>

                {/* Log Meal Button & Motivational Feedback */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {loggedMessage ? (
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 shadow-2xs ${
                      loggedMessage.isMatch
                        ? "bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                        : "bg-amber-50/90 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100"
                    }`}>
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>{loggedMessage.title}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200">{loggedMessage.text}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <button
                        onClick={handleLogMeal}
                        disabled={loggingMeal}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold rounded-full hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                      >
                        {loggingMeal ? "Saving..." : "+ Log to Today's Journal"}
                      </button>
                      <span className="text-xs font-data text-slate-900 dark:text-slate-100 font-bold">
                        {Math.round(getNutrientValue(result.total_nutrients || result.nutrients || {}, "calories") || 0)} kcal
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Glycemic Index & Glycemic Load Impact Card */}
              <Card className="bg-gradient-to-br from-white via-amber-50/30 to-emerald-50/30 dark:from-slate-900 dark:via-amber-950/20 dark:to-emerald-950/20 border-amber-200/70 dark:border-amber-900/60">
                <SectionEyebrow>Glycemic Profile & Blood Sugar Impact</SectionEyebrow>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Glycemic Index (GI)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-data text-xl font-bold text-slate-900 dark:text-slate-100">
                        {result.gi !== null && result.gi !== undefined ? result.gi : "N/A"}
                      </span>
                      {result.gi_category && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getCategoryBadgeClass(result.gi_category)}`}>
                          {result.gi_category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Glycemic Load (GL)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-data text-xl font-bold text-slate-900 dark:text-slate-100">
                        {result.gl !== null && result.gl !== undefined ? result.gl : "N/A"}
                      </span>
                      {result.gl_category && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getCategoryBadgeClass(result.gl_category)}`}>
                          {result.gl_category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Net Available Carbs</span>
                    <span className="font-data text-xl font-bold text-indigo-700 dark:text-indigo-300">
                      {result.available_carbs_g !== null && result.available_carbs_g !== undefined
                        ? `${result.available_carbs_g}g`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Macros bar chart */}
              <Card>
                <SectionEyebrow>Nutrient Breakdown</SectionEyebrow>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 mb-5">
                  Per serving ×{portion.toFixed(1)} · cooking-retention adjusted
                </p>
                <div className="space-y-4">
                  {Object.entries(NUTRIENT_COLORS).map(([key, meta]) => {
                    const nutrientsObj = result.total_nutrients || result.nutrients || {};
                    const val = getNutrientValue(nutrientsObj, key);
                    if (val === undefined || val === null) return null;
                    const pct = Math.min(100, (val / meta.max) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{meta.label}</span>
                          <span className="font-data text-xs font-bold text-slate-900 dark:text-slate-100">
                            {typeof val === "number" ? val.toFixed(1) : val} {meta.unit}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${meta.color} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Ingredients breakdown */}
              {((result.ingredients_breakdown && result.ingredients_breakdown.length > 0) ||
                (result.ingredients && result.ingredients.length > 0)) && (
                <Card>
                  <SectionEyebrow>Ingredient Composition</SectionEyebrow>
                  <div className="mt-4 space-y-2.5">
                    {(result.ingredients_breakdown || result.ingredients || []).map((ing, i) => {
                      const name = ing.ingredient_name || ing.name;
                      const grams = ing.cooked_scaled_grams ?? ing.grams_adjusted ?? ing.raw_serving_grams ?? ing.grams;
                      const method = ing.cooking_method;
                      return (
                        <div key={i} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                          <span className="text-slate-800 dark:text-slate-200 font-semibold capitalize">{name}</span>
                          <div className="flex items-center gap-3 font-data text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{typeof grams === "number" ? grams.toFixed(0) : grams}g</span>
                            {method && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {method}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Disclaimer */}
              {result.disclaimer && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic leading-relaxed px-1">
                  {result.disclaimer}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
