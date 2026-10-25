import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Card, SectionEyebrow } from "../components/Cards";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";

const SYMPTOM_FIELDS = [
  { key: "fatigue", label: "Fatigue & Low Energy" },
  { key: "hair_loss", label: "Hair Loss / Thinning" },
  { key: "pale_skin", label: "Pale Skin / Conjunctival Pallor" },
  { key: "muscle_cramps", label: "Muscle Cramps & Spasms" },
  { key: "bone_pain", label: "Bone & Joint Pain" },
  { key: "frequent_illness", label: "Frequent Illness / Low Immunity" },
  { key: "brittle_nails", label: "Brittle / Spoon-shaped Nails (Koilonychia)" },
  { key: "dizziness", label: "Dizziness & Lightheadedness" },
  { key: "numbness_tingling", label: "Numbness & Tingling in Hands/Feet (Paresthesia)" },
  { key: "slow_wound_healing", label: "Slow Wound Healing" },
  { key: "bleeding_gums", label: "Bleeding Gums / Mouth Ulcers" },
  { key: "brain_fog", label: "Brain Fog & Poor Concentration" },
  { key: "dry_skin", label: "Dry & Flaky Skin" },
];

const MEDICAL_FIELDS = [
  { key: "diabetes", label: "Type 1 / Type 2 Diabetes" },
  { key: "hypertension", label: "Hypertension / High Blood Pressure" },
  { key: "thyroid_disorder", label: "Thyroid Disorder (Hypo/Hyperthyroidism)" },
  { key: "celiac_disease", label: "Celiac Disease / Malabsorption" },
  { key: "kidney_disease", label: "Chronic Kidney Disease (CKD)" },
  { key: "gastrointestinal_disorder", label: "Gastrointestinal Disorder (IBD / IBS / Gastritis)" },
  { key: "fatty_liver", label: "Fatty Liver Disease (NAFLD)" },
  { key: "osteoporosis", label: "Osteoporosis / Osteopenia" },
  { key: "anemia_history", label: "Chronic Anemia History" },
  { key: "cardiovascular_disease", label: "Cardiovascular / Heart Disease" },
  { key: "medical_none", label: "None / No Diagnosed Conditions" },
];

const MEDICATION_FIELDS = [
  { key: "levothyroxine", label: "Levothyroxine / Eltroxin (Thyroid Hormone)" },
  { key: "warfarin", label: "Warfarin / Coumadin (Blood Thinner)" },
  { key: "metformin", label: "Metformin / Glycomet (Diabetes)" },
  { key: "omeprazole", label: "Omeprazole / Pantoprazole / PPI Antacids" },
  { key: "statins", label: "Atorvastatin / Rosuvastatin (Cholesterol)" },
  { key: "diuretics", label: "Furosemide / Hydrochlorothiazide (Water Pills)" },
  { key: "corticosteroids", label: "Prednisone / Dexamethasone (Steroids)" },
];

const ALLERGY_OPTIONS = [
  { key: "eggs", label: "Eggs" },
  { key: "dairy", label: "Dairy / Lactose" },
  { key: "nuts", label: "Peanuts & Tree Nuts" },
  { key: "seafood", label: "Fish & Seafood" },
  { key: "soy", label: "Soy Products" },
  { key: "wheat_gluten", label: "Wheat / Gluten" },
];

export default function ProfileForm() {
  const { profile, updateProfile, setPrediction, setNutrition, setRecommendation, user } = useAssessment();
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleReportUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReport(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = user ? await api.uploadBloodReport(formData) : await api.extractBloodReport(formData);
      updateProfile({
        iron_level: res.iron_level !== null ? String(res.iron_level) : "",
        calcium_level: res.calcium_level !== null ? String(res.calcium_level) : "",
        vitamin_d_level: res.vitamin_d_level !== null ? String(res.vitamin_d_level) : "",
        vitamin_b12_level: res.vitamin_b12_level !== null ? String(res.vitamin_b12_level) : "",
      });
    } catch (err) {
      setUploadError(err.message || "Failed to parse report.");
    } finally {
      setUploadingReport(false);
    }
  }
  const navigate = useNavigate();

  function handleChange(key, value) {
    updateProfile({ [key]: value });
  }

  function toggleSymptom(key) {
    updateProfile({ [key]: !profile[key] });
  }

  function toggleAllergy(key) {
    const current = profile.allergies || [];
    if (current.includes(key)) {
      updateProfile({ allergies: current.filter((k) => k !== key) });
    } else {
      updateProfile({ allergies: [...current, key] });
    }
  }

  function handleDislikesChange(val) {
    const items = val.split(",").map((s) => s.trim());
    updateProfile({ disliked_foods: items });
  }

  function toggleMedical(key) {
    if (key === "medical_none") {
      updateProfile({
        medical_none: !profile.medical_none,
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
      });
    } else {
      updateProfile({ [key]: !profile[key], medical_none: false });
    }
  }

  function validate() {
    const e = {};
    if (!profile.name || !String(profile.name).trim()) e.name = "Name is required";
    
    const age = Number(profile.age);
    if (!profile.age || isNaN(age) || age < 1 || age > 120) e.age = "Enter a valid age (1-120)";
    
    const height = Number(profile.height_cm);
    if (!profile.height_cm || isNaN(height) || height <= 30 || height >= 272) e.height_cm = "Enter a valid height in cm";
    
    const weight = Number(profile.weight_kg);
    if (!profile.weight_kg || isNaN(weight) || weight <= 2 || weight >= 500) e.weight_kg = "Enter a valid weight in kg";
    
    const sleep = Number(profile.sleep_hours);
    if (profile.sleep_hours === "" || isNaN(sleep) || sleep < 0 || sleep > 24) e.sleep_hours = "Enter hours between 0-24";
    
    const water = Number(profile.water_intake_l);
    if (profile.water_intake_l === "" || isNaN(water) || water < 0 || water > 15) e.water_intake_l = "Enter liters between 0-15";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    // Reset downstream results since the profile changed.
    setPrediction(null);
    setNutrition(null);
    setRecommendation(null);

    try {
      const dislikedList = Array.isArray(profile.disliked_foods)
        ? profile.disliked_foods
        : (profile.disliked_foods || "").split(",").map((s) => s.trim()).filter(Boolean);

      await api.createUser({
        user_id: user ? user.id : null,
        name: profile.name,
        age: Number(profile.age),
        gender: profile.gender,
        height_cm: Number(profile.height_cm),
        weight_kg: Number(profile.weight_kg),
        activity_level: profile.activity_level,
        sleep_hours: Number(profile.sleep_hours),
        water_intake_l: Number(profile.water_intake_l),
        diet: profile.diet,
        allergies: profile.allergies || [],
        disliked_foods: dislikedList,
        cooking_method: profile.cooking_method || "steamed",
        cuisine_preference: profile.cuisine_preference || "indian",
        user_location: profile.user_location || null,
        occupation: profile.occupation || "Desk / Office Worker",
        symptoms: {
          fatigue: !!profile.fatigue, hair_loss: !!profile.hair_loss, pale_skin: !!profile.pale_skin, muscle_cramps: !!profile.muscle_cramps,
          bone_pain: !!profile.bone_pain, frequent_illness: !!profile.frequent_illness, brittle_nails: !!profile.brittle_nails, dizziness: !!profile.dizziness,
          numbness_tingling: !!profile.numbness_tingling, slow_wound_healing: !!profile.slow_wound_healing, bleeding_gums: !!profile.bleeding_gums,
          brain_fog: !!profile.brain_fog, dry_skin: !!profile.dry_skin,
        },
        medical_history: {
          diabetes: !!profile.diabetes, hypertension: !!profile.hypertension, thyroid_disorder: !!profile.thyroid_disorder, celiac_disease: !!profile.celiac_disease,
          kidney_disease: !!profile.kidney_disease, gastrointestinal_disorder: !!profile.gastrointestinal_disorder, fatty_liver: !!profile.fatty_liver,
          osteoporosis: !!profile.osteoporosis, anemia_history: !!profile.anemia_history, cardiovascular_disease: !!profile.cardiovascular_disease, none: !!profile.medical_none,
          levothyroxine: !!profile.levothyroxine, warfarin: !!profile.warfarin, metformin: !!profile.metformin, omeprazole: !!profile.omeprazole,
          statins: !!profile.statins, diuretics: !!profile.diuretics, corticosteroids: !!profile.corticosteroids,
        },
        iron_level: profile.iron_level ? Number(profile.iron_level) : null,
        calcium_level: profile.calcium_level ? Number(profile.calcium_level) : null,
        vitamin_d_level: profile.vitamin_d_level ? Number(profile.vitamin_d_level) : null,
        vitamin_b12_level: profile.vitamin_b12_level ? Number(profile.vitamin_b12_level) : null,
      });
      navigate("/prediction");
    } catch (err) {
      setSubmitError(err.message || "Something went wrong saving your profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col lg:flex-row gap-6 lg:gap-10 overflow-hidden">
      <Sidebar activeKey="profile" completedKeys={[]} />

      <div className="flex-1 w-full min-w-0 max-w-2xl">
        <SectionEyebrow>User Profiling & Assessment</SectionEyebrow>
        <h1 className="font-display text-3xl text-ink dark:text-slate-100 mb-2">Tell us about yourself</h1>
        <p className="text-ink-soft dark:text-slate-300 mb-8">
          This informs the deficiency model and nutrition engine. Your assessment is processed by the AlteraVie backend. Signed-in users can retrieve saved assessment history.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <SectionEyebrow>Personal information</SectionEyebrow>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <Field label="Name" error={errors.name}>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={inputClass(errors.name)}
                  placeholder="Jane Doe"
                />
              </Field>
              <Field label="Age" error={errors.age}>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className={inputClass(errors.age)}
                  placeholder="28"
                />
              </Field>
              <Field label="Gender">
                <select
                  value={profile.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className={inputClass()}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Height (cm)" error={errors.height_cm}>
                  <input
                    type="number"
                    value={profile.height_cm}
                    onChange={(e) => handleChange("height_cm", e.target.value)}
                    className={inputClass(errors.height_cm)}
                    placeholder="162"
                  />
                </Field>
                <Field label="Weight (kg)" error={errors.weight_kg}>
                  <input
                    type="number"
                    value={profile.weight_kg}
                    onChange={(e) => handleChange("weight_kg", e.target.value)}
                    className={inputClass(errors.weight_kg)}
                    placeholder="55"
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card>
            <SectionEyebrow>Lifestyle</SectionEyebrow>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <Field label="Activity level">
                <select
                  value={profile.activity_level}
                  onChange={(e) => handleChange("activity_level", e.target.value)}
                  className={inputClass()}
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Occupation / Daily Work Type">
                <select
                  value={profile.occupation || "Desk / Office Worker"}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  className={inputClass()}
                >
                  <option value="Desk / Office Worker">Desk / Office Worker (Software, Finance, Admin)</option>
                  <option value="Active / On-the-Feet">Active / On-the-Feet (Healthcare, Teaching, Retail)</option>
                  <option value="Physical Labor / Field Work">Physical Labor / Field Work (Construction, Sports, Delivery)</option>
                  <option value="Night Shift / Rotational">Night Shift / Rotational (Customer Support, Security)</option>
                </select>
              </Field>
              <Field label="Diet">
                <select
                  value={profile.diet}
                  onChange={(e) => handleChange("diet", e.target.value)}
                  className={inputClass()}
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non-vegetarian">Non-vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </Field>
              <Field label="Sleep hours / night" error={errors.sleep_hours}>
                <input
                  type="number"
                  step="0.5"
                  value={profile.sleep_hours}
                  onChange={(e) => handleChange("sleep_hours", e.target.value)}
                  className={inputClass(errors.sleep_hours)}
                  placeholder="7"
                />
              </Field>
              <Field label="Water intake (L / day)" error={errors.water_intake_l}>
                <input
                  type="number"
                  step="0.1"
                  value={profile.water_intake_l}
                  onChange={(e) => handleChange("water_intake_l", e.target.value)}
                  className={inputClass(errors.water_intake_l)}
                  placeholder="2.0"
                />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionEyebrow>Dietary Restrictions & Allergies</SectionEyebrow>
            <p className="text-xs text-ink-soft dark:text-slate-400 mt-1 leading-relaxed">
              Select any food allergies or specific foods you dislike (e.g. egg, mushroom). All meal recommendations will strictly exclude these items.
            </p>
            <div className="mt-3">
              <span className="text-xs font-semibold text-ink dark:text-slate-200 uppercase tracking-wider block mb-2">Food Allergies</span>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {ALLERGY_OPTIONS.map((a) => (
                  <Checkbox
                    key={a.key}
                    label={a.label}
                    checked={(profile.allergies || []).includes(a.key)}
                    onChange={() => toggleAllergy(a.key)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Field label="Disliked / Excluded Foods (comma-separated)">
                <input
                  type="text"
                  value={Array.isArray(profile.disliked_foods) ? profile.disliked_foods.join(", ") : (profile.disliked_foods || "")}
                  onChange={(e) => handleDislikesChange(e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. egg, mushroom, liver, dates"
                />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionEyebrow>Cuisine Preference & Local Food Accessibility</SectionEyebrow>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Select your preferred style of food and your location. AlteraVie will automatically adapt all recipes using 100% locally accessible ingredients.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field label="Cuisine Preference">
                <select
                  value={profile.cuisine_preference || "indian"}
                  onChange={(e) => handleChange("cuisine_preference", e.target.value)}
                  className={inputClass()}
                >
                  <option value="indian">Indian (Regional / Traditional)</option>
                  <option value="continental">Continental / Mediterranean</option>
                  <option value="asian">Asian / Pan-Asian</option>
                  <option value="global">Global / Fusion</option>
                </select>
              </Field>
              <Field label="Your Location / Region">
                <select
                  value={profile.user_location || "India - South"}
                  onChange={(e) => handleChange("user_location", e.target.value)}
                  className={inputClass()}
                >
                  <option value="India - South">India - South (Tamil Nadu, Karnataka, Kerala, AP)</option>
                  <option value="India - North">India - North (Delhi, Punjab, UP, Haryana)</option>
                  <option value="India - West">India - West & Central (Maharashtra, Gujarat)</option>
                  <option value="India - East">India - East (Bengal, Odisha, North East)</option>
                  <option value="North America">North America (USA & Canada)</option>
                  <option value="Europe">Europe / UK</option>
                  <option value="Southeast Asia">Southeast Asia / Others</option>
                </select>
              </Field>
            </div>
            <div className="mt-4 p-3.5 bg-[#DCEBD8] dark:bg-emerald-950/60 rounded-xl border border-[#3AAE6F]/30 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold text-[#3AAE6F] dark:text-emerald-300">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Recipes will strictly use ingredients easily accessible in {profile.user_location || "your local area"}.</span>
            </div>
          </Card>

          <Card>
            <SectionEyebrow>Symptoms & Physical Signs</SectionEyebrow>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select any symptoms you have experienced over the past 30 days to refine deficiency likelihoods.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
              {SYMPTOM_FIELDS.map((s) => (
                <Checkbox
                  key={s.key}
                  label={s.label}
                  checked={profile[s.key]}
                  onChange={() => toggleSymptom(s.key)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionEyebrow>Diagnosed Medical Conditions</SectionEyebrow>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Chronic conditions affect nutrient absorption, renal clearance, and metabolic requirements.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
              {MEDICAL_FIELDS.map((m) => (
                <Checkbox
                  key={m.key}
                  label={m.label}
                  checked={profile[m.key]}
                  onChange={() => toggleMedical(m.key)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionEyebrow>Prescription Medications & Drug Safety</SectionEyebrow>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Certain medications interact with dietary minerals or alter nutrient uptake. Select any current prescriptions.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
              {MEDICATION_FIELDS.map((med) => (
                <Checkbox
                  key={med.key}
                  label={med.label}
                  checked={profile[med.key]}
                  onChange={() => handleChange(med.key, !profile[med.key])}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionEyebrow>Blood Test Results (Optional)</SectionEyebrow>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Have a blood test report? Upload it below to automatically fill in your nutrient levels.
            </p>

            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
                onChange={handleReportUpload}
                disabled={uploadingReport}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-1 pointer-events-none">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {uploadingReport ? "Reading test values..." : "Click or drag report file here"}
                </p>
                <p className="text-[10px] text-ink-soft dark:text-slate-400 mt-0.5">PDF, TXT, CSV formats</p>
              </div>
            </div>

            {uploadError && (
              <p className="mt-2 text-xs text-clay-500 font-medium">{uploadError}</p>
            )}

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <Field label="Iron / Ferritin (ng/mL)">
                <input
                  type="number"
                  step="0.1"
                  value={profile.iron_level}
                  onChange={(e) => handleChange("iron_level", e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. 15.4"
                />
              </Field>
              <Field label="Calcium (mg/dL)">
                <input
                  type="number"
                  step="0.1"
                  value={profile.calcium_level}
                  onChange={(e) => handleChange("calcium_level", e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. 8.2"
                />
              </Field>
              <Field label="Vitamin D (ng/mL)">
                <input
                  type="number"
                  step="0.1"
                  value={profile.vitamin_d_level}
                  onChange={(e) => handleChange("vitamin_d_level", e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. 18.0"
                />
              </Field>
              <Field label="Vitamin B12 (pg/mL)">
                <input
                  type="number"
                  step="0.1"
                  value={profile.vitamin_b12_level}
                  onChange={(e) => handleChange("vitamin_b12_level", e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. 150.0"
                />
              </Field>
            </div>
          </Card>

          {submitError && (
            <p className="text-sm text-clay-500 bg-clay-100 border border-clay-400/30 rounded-lg px-4 py-3">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-full bg-forest-500 text-paper-raised font-semibold text-sm hover:bg-forest-600 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Continue to prediction"}
          </button>
        </form>
      </div>
    </div>
  );
}

function inputClass(error) {
  return `w-full rounded-lg border bg-paper dark:bg-slate-800 px-3.5 py-2.5 text-sm text-ink dark:text-slate-100 outline-none transition-colors focus:border-forest-500 ${
    error ? "border-clay-400" : "border-mist-300 dark:border-slate-700"
  }`;
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft dark:text-slate-300 mb-1.5 block">{label}</span>
      {children}
      {error && <span className="text-xs text-clay-500 mt-1 block">{error}</span>}
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none py-1 hover:opacity-90 transition-opacity">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`w-5 h-5 rounded-md border grid place-items-center shrink-0 transition-all ${
          checked
            ? "bg-[#3AAE6F] border-[#3AAE6F] text-white shadow-xs"
            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-white stroke-[2.5]">
            <path d="M3 8.5L6.5 12L13 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="font-medium">{label}</span>
    </label>
  );
}
