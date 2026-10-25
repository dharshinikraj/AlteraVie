import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../api/client";

const AssessmentContext = createContext(null);

const emptyProfile = {
  name: "",
  age: "",
  gender: "female",
  height_cm: "",
  weight_kg: "",
  activity_level: "moderate",
  sleep_hours: "",
  water_intake_l: "",
  diet: "vegetarian",
  fatigue: false,
  hair_loss: false,
  pale_skin: false,
  muscle_cramps: false,
  bone_pain: false,
  frequent_illness: false,
  brittle_nails: false,
  dizziness: false,
  numbness_tingling: false,
  slow_wound_healing: false,
  bleeding_gums: false,
  brain_fog: false,
  dry_skin: false,
  diabetes: false,
  hypertension: false,
  thyroid_disorder: false,
  celiac_disease: false,
  kidney_disease: false,
  gastrointestinal_disorder: false,
  fatty_liver: false,
  osteoporosis: false,
  anemia_history: false,
  cardiovascular_disease: false,
  levothyroxine: false,
  warfarin: false,
  metformin: false,
  omeprazole: false,
  statins: false,
  diuretics: false,
  corticosteroids: false,
  medical_none: false,
  cooking_method: "steamed",
  iron_level: "",
  calcium_level: "",
  vitamin_d_level: "",
  vitamin_b12_level: "",
  allergies: [],
  disliked_foods: [],
  cuisine_preference: "indian",
  user_location: "India - South",
  occupation: "Desk / Office Worker",
};

function profileFromHistory(latest, fallbackName = "") {
  return { ...emptyProfile, name: latest?.name || fallbackName || "", age: latest?.age ?? "", gender: latest?.gender || "female",
    height_cm: latest?.height_cm ?? "", weight_kg: latest?.weight_kg ?? "", activity_level: latest?.activity_level || "moderate",
    sleep_hours: latest?.sleep_hours ?? "", water_intake_l: latest?.water_intake_l ?? "", diet: latest?.diet || "vegetarian",
    fatigue: !!latest?.symptom_fatigue, hair_loss: !!latest?.symptom_hair_loss, pale_skin: !!latest?.symptom_pale_skin, muscle_cramps: !!latest?.symptom_muscle_cramps,
    bone_pain: !!latest?.symptom_bone_pain, frequent_illness: !!latest?.symptom_frequent_illness, brittle_nails: !!latest?.symptom_brittle_nails, dizziness: !!latest?.symptom_dizziness,
    numbness_tingling: !!latest?.symptom_numbness_tingling, slow_wound_healing: !!latest?.symptom_slow_wound_healing, bleeding_gums: !!latest?.symptom_bleeding_gums, brain_fog: !!latest?.symptom_brain_fog, dry_skin: !!latest?.symptom_dry_skin,
    diabetes: !!latest?.medical_diabetes, hypertension: !!latest?.medical_hypertension, thyroid_disorder: !!latest?.medical_thyroid_disorder, celiac_disease: !!latest?.medical_celiac_disease, kidney_disease: !!latest?.medical_kidney_disease,
    gastrointestinal_disorder: !!latest?.medical_gastrointestinal_disorder, fatty_liver: !!latest?.medical_fatty_liver, osteoporosis: !!latest?.medical_osteoporosis, anemia_history: !!latest?.medical_anemia_history, cardiovascular_disease: !!latest?.medical_cardiovascular_disease, medical_none: !!latest?.medical_none,
    levothyroxine: !!latest?.medication_levothyroxine, warfarin: !!latest?.medication_warfarin, metformin: !!latest?.medication_metformin, omeprazole: !!latest?.medication_omeprazole, statins: !!latest?.medication_statins, diuretics: !!latest?.medication_diuretics, corticosteroids: !!latest?.medication_corticosteroids,
    iron_level: latest?.iron_level != null ? String(latest.iron_level) : "", calcium_level: latest?.calcium_level != null ? String(latest.calcium_level) : "", vitamin_d_level: latest?.vitamin_d_level != null ? String(latest.vitamin_d_level) : "", vitamin_b12_level: latest?.vitamin_b12_level != null ? String(latest.vitamin_b12_level) : "", allergies: latest?.allergies || [], disliked_foods: latest?.disliked_foods || [], cooking_method: latest?.cooking_method || "steamed", cuisine_preference: latest?.cuisine_preference || "indian", user_location: latest?.user_location || "India - South", occupation: latest?.occupation || "Desk / Office Worker" };
}

export const THEMES_LIST = [
  { id: "botanical", name: "Botanical", emoji: "🌿", primary: "#3AAE6F", accent: "#DCEBD8", bg: "#F7F9F7", desc: "Fresh organic sage & mint greens" },
  { id: "berry", name: "Berry Garden", emoji: "🍓", primary: "#E11D48", accent: "#FFE4E6", bg: "#FFF1F2", desc: "Vibrant berry pinks & rich rose" },
  { id: "enchanted", name: "Enchanted Grove", emoji: "🍄", primary: "#15803D", accent: "#FEF3C7", bg: "#FDFBF7", desc: "Deep forest moss & warm amber" },
  { id: "moon", name: "Moon Garden", emoji: "🌙", primary: "#6366F1", accent: "#E0E7FF", bg: "#0F172A", desc: "Sleek dark violet & indigo midnight" },
  { id: "cozy_tea", name: "Cozy Tea", emoji: "🍵", primary: "#65A30D", accent: "#ECFCCB", bg: "#FAF8F5", desc: "Calming matcha green & warm cream" },
  { id: "seaside", name: "Seaside", emoji: "🌊", primary: "#0284C7", accent: "#E0F2FE", bg: "#F0F9FF", desc: "Refreshing ocean blue & cyan breeze" },
  { id: "sakura", name: "Sakura", emoji: "🌸", primary: "#EC4899", accent: "#FCE7F3", bg: "#FFF5F8", desc: "Soft cherry blossom pink & magenta" },
];

export function AssessmentProvider({ children }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [prediction, setPrediction] = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("nutriassess_token") || null);
  const [booting, setBooting] = useState(true);

  // Theme State (light / dark mode)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("alteravie_theme") || "light";
  });

  // Atmosphere Theme State (7 visual theme presets)
  const [atmosphereTheme, setAtmosphereTheme] = useState(() => {
    return localStorage.getItem("alteravie_atmosphere_theme") || "botanical";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("alteravie_theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (atmosphereTheme) {
      root.setAttribute("data-theme", atmosphereTheme);
    }
    localStorage.setItem("alteravie_atmosphere_theme", atmosphereTheme);
  }, [atmosphereTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const changeAtmosphereTheme = useCallback((newTheme) => {
    setAtmosphereTheme(newTheme);
  }, []);

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setProfile(emptyProfile);
    setPrediction(null);
    setNutrition(null);
    setRecommendation(null);
  }, []);

  const login = useCallback((userData, userToken) => {
    localStorage.setItem("nutriassess_token", userToken);
    setToken(userToken);
    setUser(userData);
    
    // Fetch latest profile to prefill
    api.getAssessmentsHistory().then((history) => {
      if (history && history.length > 0) {
        const latest = history[0];
        setProfile(profileFromHistory(latest, userData.name));
} else {
        setProfile((prev) => ({ ...prev, name: userData.name }));
      }
    }).catch(() => {
      setProfile((prev) => ({ ...prev, name: userData.name }));
    });
  }, []);

  const logout = useCallback(() => {
    api.logout().catch(() => {});
    localStorage.removeItem("nutriassess_token");
    setToken(null);
    setUser(null);
    reset();
  }, [reset]);

  // Boot: load user details if token exists
  useEffect(() => {
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          // Prefill from history if they had past assessments
          api.getAssessmentsHistory().then((history) => {
            if (history && history.length > 0) {
              const latest = history[0];
              setProfile(profileFromHistory(latest, userData.name));
} else {
              setProfile((prev) => ({ ...prev, name: userData.name }));
            }
          }).catch(() => {
            setProfile((prev) => ({ ...prev, name: userData.name }));
          });
        })
        .catch(() => {
          localStorage.removeItem("nutriassess_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setBooting(false));
    } else {
      setBooting(false);
    }
  }, [token]);

  return (
    <AssessmentContext.Provider
      value={{
        profile,
        updateProfile,
        prediction,
        setPrediction,
        nutrition,
        setNutrition,
        recommendation,
        setRecommendation,
        user,
        token,
        login,
        logout,
        reset,
        booting,
        theme,
        toggleTheme,
        atmosphereTheme,
        changeAtmosphereTheme,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
