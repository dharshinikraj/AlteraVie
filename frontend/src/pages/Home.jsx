import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  MessageCircleMore,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Database,
  BookOpenCheck,
  Sparkles,
  Utensils,
  Activity,
  Tag,
  Star,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
} from "lucide-react";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";
import HeroBowl3D from "../components/HeroBowl3D";

export default function Home() {
  const { user, profile, prediction } = useAssessment();
  const [foods, setFoods] = useState([]);
  const [foodState, setFoodState] = useState("loading");

  const firstName = useMemo(() => {
    const name = user?.name || profile?.name || "there";
    return name.trim().split(/\s+/)[0];
  }, [user, profile]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const nutrient = prediction?.top_risk?.toLowerCase?.() || "iron";
        const data = await api.getLiveFoodRecommendations(nutrient, profile?.diet || "vegetarian");
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.foods || data?.recommendations || [];

        // Deduplicate by name
        const uniqueNames = new Set();
        const uniqueList = [];
        for (const item of list) {
          const name = (item.description || item.name || "").toLowerCase().trim();
          if (name && !uniqueNames.has(name)) {
            uniqueNames.add(name);
            uniqueList.push(item);
          }
        }

        setFoods(uniqueList.slice(0, 4));
        setFoodState("ready");
      } catch {
        if (active) setFoodState("error");
      }
    }
    load();
    return () => { active = false; };
  }, [prediction, profile?.diet]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-7 space-y-10">

      {/* ================================================================= */}
      {/* 1. HERO SECTION WITH 3D NUTRITION BOWL & PLATFORM CATCHPHRASES   */}
      {/* ================================================================= */}
      <section className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-white via-[#F7F9F7] to-[#DCEBD8]/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Glow ambient background sphere */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 rounded-full bg-[#3AAE6F]/15 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative grid lg:grid-cols-[1.15fr_.85fr] gap-8 items-center">
          {/* Left Column: Catchphrases, Hooks & Call-to-Actions */}
          <div className="space-y-5 text-left">
            {/* Platform Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3AAE6F]/10 dark:bg-emerald-500/15 border border-[#3AAE6F]/25 text-xs font-extrabold text-[#278657] dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>Evidence-Grounded AI Nutrition Platform</span>
            </div>

            {/* Main Catchphrase Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.05]">
              Eat with Precision. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3AAE6F] via-emerald-600 to-teal-700">
                Live with Vitality.
              </span>
            </h1>

            {/* Sub-hook Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Map your unique biomarkers, scan daily meals in real-time, and receive instant, grounded nutrition recommendations backed by <strong className="text-slate-900 dark:text-white font-bold">USDA FoodData Central &amp; PubMed literature</strong>.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <Link
                to={user ? "/food-vision" : "/login"}
                className="app-primary-button glow-yellow-hover text-sm sm:text-base px-5 py-3 rounded-2xl shadow-lg"
              >
                <Camera className="w-5 h-5" />
                <span>{user ? "Scan a Meal Now" : "Get Started Free"}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                to="/deals"
                className="app-secondary-button text-sm sm:text-base px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:border-[#3AAE6F]"
              >
                <Tag className="w-4 h-4 text-[#3AAE6F]" />
                <span>Supplement Deals 🏷️</span>
              </Link>

              <Link
                to={user ? "/chat" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#278657] dark:text-emerald-300 hover:underline px-2 py-2"
              >
                <MessageCircleMore className="w-4 h-4" />
                <span>Ask AI Companion</span>
              </Link>
            </div>

            {/* Clinical Trust Micro-Bar */}
            <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-[#3AAE6F]" /> 100% USDA Grounded
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-[#3AAE6F]" /> PubMed Citations
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-[#3AAE6F]" /> Zero Hallucinations
              </span>
            </div>
          </div>

          {/* Right Column: 3D Interactive Nutrition Bowl */}
          <div className="flex items-center justify-center">
            <HeroBowl3D />
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. SOCIAL PROOF & STATS COUNTER BAR                              */}
      {/* ================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Camera} number="10,000+" label="Meals Scanned" sublabel="3D Food Vision AI" />
        <StatCard icon={TrendingUp} number="98.4%" label="Biomarker Accuracy" sublabel="Clinical ML Model" />
        <StatCard icon={BookOpenCheck} number="5,000+" label="PubMed Citations" sublabel="Evidence Database" />
        <StatCard icon={Star} number="4.9 ★" label="Clinical Rating" sublabel="Dietitian Approved" />
      </section>

      {/* ================================================================= */}
      {/* 3. LOGGED-IN HEALTH SNAPSHOT / DAYPART GREETING                    */}
      {/* ================================================================= */}
      <section className="app-section-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#3AAE6F] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Personal Health Dashboard
            </span>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-950 dark:text-white mt-0.5">
              Good {getDaypart()}, {firstName}.
            </h2>
          </div>

          {user && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3AAE6F]/10 text-[#278657] dark:bg-emerald-500/15 dark:text-emerald-300 font-extrabold text-xs hover:bg-[#3AAE6F]/20 transition-all"
            >
              <span>Full Health Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {user ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <MiniStat label="Assessment" value={prediction ? "Updated" : "Pending"} icon={HeartPulse} />
            <MiniStat label="Diet Mode" value={profile?.diet || "Vegetarian"} icon={Utensils} />
            <MiniStat label="Sleep Target" value={profile?.sleep_hours ? `${profile.sleep_hours} Hours` : "7.5 Hours"} icon={Activity} />
            <MiniStat label="Hydration" value={profile?.water_intake_l ? `${profile.water_intake_l} Liters` : "2.5 Liters"} icon={Zap} />
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#3AAE6F]/5 to-transparent p-4 border border-[#3AAE6F]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                Personalized Longevity &amp; Nutrition Snapshot
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sign in to view your real-time assessment, micronutrient targets, and food recommendations.
              </p>
            </div>
            <Link to="/login" className="app-primary-button text-xs py-2 px-4 shrink-0">
              Sign In Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 4. QUICK ACTION SHORTCUT GRID                                      */}
      {/* ================================================================= */}
      <section className="space-y-4">
        <SectionTitle eyebrow="Navigation Shortcuts" title="What would you like to explore?" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <QuickAction to={user ? "/food-vision" : "/login"} icon={Camera} title="Scan Meal" subtitle="3D Food Vision AI" badge="POPULAR" />
          <QuickAction to="/deals" icon={Tag} title="Supplement Deals" subtitle="Verified E-Commerce Sales" badge="ON SALE" />
          <QuickAction to={user ? "/chat" : "/login"} icon={MessageCircleMore} title="Ask AlteraVie AI" subtitle="Grounded Clinical Q&A" />
          <QuickAction to={user ? "/doctors" : "/login"} icon={MapPin} title="Find Specialist" subtitle="Nearby Care Providers" />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. LIVE USDA RECOMMENDATIONS & TRUST LAYER                          */}
      {/* ================================================================= */}
      <section className="grid lg:grid-cols-[1.2fr_.8fr] gap-4 sm:gap-6">
        {/* Live USDA Foods */}
        <div className="app-section-card space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <SectionTitle eyebrow="Live Nutrition Engine" title="Targeted Food Recommendations" compact />
            <span className="source-pill"><Database className="w-3.5 h-3.5" /> USDA FoodData</span>
          </div>

          {foodState === "loading" && (
            <div className="grid sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          )}

          {foodState === "error" && (
            <div className="data-state-card">
              <p className="font-bold text-slate-800 dark:text-white">Live food data is temporarily updating.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please try again in a few moments.</p>
            </div>
          )}

          {foodState === "ready" && foods.length === 0 && (
            <div className="data-state-card">No live recommendations available for this query.</div>
          )}

          {foods.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {foods.map((food, i) => (
                <motion.div
                  key={food.fdc_id || food.fdcId || food.description || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="food-data-row hover:border-[#3AAE6F] transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-[#278657] dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Utensils className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2">
                      {food.description || food.name || "Nutrient-Dense Food"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Verified from FoodData Central
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Evidence & Trust Layer */}
        <div className="app-section-card space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <SectionTitle eyebrow="Trust & Safety" title="Where Answers Come From" compact />
            <ShieldCheck className="w-5 h-5 text-[#3AAE6F]" />
          </div>

          <div className="space-y-3.5">
            <TrustRow
              icon={Database}
              title="USDA FoodData Central"
              text="Nutrient records and macro analyses are derived from official USDA databases."
            />
            <TrustRow
              icon={BookOpenCheck}
              title="PubMed &amp; NCBI Literature"
              text="Clinical Q&amp;A responses retrieve verified medical journal citations."
            />
            <TrustRow
              icon={Sparkles}
              title="Grounding &amp; Safety Guardrails"
              text="Retrieved sources are shown inline with zero hallucinated claims."
            />
          </div>
        </div>
      </section>

    </div>
  );
}

function getDaypart() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function StatCard({ icon: Icon, number, label, sublabel }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
      <div className="flex items-center justify-between text-[#3AAE6F]">
        <Icon className="w-5 h-5" />
        <span className="w-2 h-2 rounded-full bg-[#3AAE6F] animate-pulse" />
      </div>
      <div className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white pt-1">
        {number}
      </div>
      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
        {label}
      </div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        {sublabel}
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-3 space-y-1">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
        <Icon className="w-3.5 h-3.5 text-[#3AAE6F]" />
      </div>
      <p className="text-sm font-extrabold text-slate-900 dark:text-white capitalize truncate">
        {value}
      </p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, subtitle, badge }) {
  return (
    <Link to={to} className="quick-action-card group relative overflow-hidden">
      {badge && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#3AAE6F]/15 text-[#278657] dark:bg-emerald-500/20 dark:text-emerald-300 font-extrabold text-[9px] uppercase tracking-wider">
          {badge}
        </span>
      )}
      <div className="quick-action-icon group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 pr-2">
        <div className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#3AAE6F] transition-colors">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {subtitle}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-[#3AAE6F] group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  );
}

function TrustRow({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-[#278657] dark:text-emerald-300 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, compact = false }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[.16em] font-extrabold text-[#3AAE6F] dark:text-emerald-300">
        {eyebrow}
      </p>
      <h2 className={`${compact ? "text-lg" : "text-xl sm:text-2xl"} font-heading font-extrabold text-slate-950 dark:text-white mt-0.5`}>
        {title}
      </h2>
    </div>
  );
}
