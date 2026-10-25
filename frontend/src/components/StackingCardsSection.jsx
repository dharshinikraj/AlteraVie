import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Camera, Sparkles, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const CARDS_DATA = [
  {
    num: "01",
    category: "RECIPE OF THE WEEK",
    title: "Nutrient-Packed Green Goddess Bowl",
    description: "Fresh kale, hass avocado, steamed wild asparagus, and lemon chia dressing to help your body easily absorb natural iron and boost daily energy.",
    macros: [
      { label: "Protein", val: "22g" },
      { label: "Iron Goal", val: "68%" },
      { label: "Vitamins Kept", val: "96%" }
    ],
    ctaText: "Explore Meal Plan",
    ctaLink: "/recommendations",
    badge: "100% ORGANIC",
    icon: Leaf
  },
  {
    num: "02",
    category: "SMART MEAL CAMERA",
    title: "Instant Food Photo Scanner",
    description: "Snap a quick photo of your plate. Our smart camera instantly highlights the vitamins, calories, and healthy goodness in your meal.",
    macros: [
      { label: "Accuracy", val: "94%" },
      { label: "Scan Time", val: "Instant" },
      { label: "Nutrients", val: "30+ Tracked" }
    ],
    ctaText: "Try Food Scanner",
    ctaLink: "/food-vision",
    badge: "EASY CAMERA",
    icon: Camera
  },
  {
    num: "03",
    category: "HEALTH CHECK",
    title: "Personalized Health Need Quiz",
    description: "Answer simple questions about your routine, sleep, and energy levels to discover if your body needs more Iron, Vitamin D, B12, Calcium, or Zinc.",
    macros: [
      { label: "Simple Quiz", val: "3 Mins" },
      { label: "Nutrients", val: "5 Core" },
      { label: "Result", val: "Instant" }
    ],
    ctaText: "Start Health Quiz",
    ctaLink: "/profile",
    badge: "SIMPLE QUIZ",
    icon: Activity
  },
  {
    num: "04",
    category: "CARE FINDER",
    title: "Find Top Dietitians & Doctors Near You",
    description: "Connect with friendly, verified dietitians and health specialists nearby with interactive maps, reviews, and direct contact options.",
    macros: [
      { label: "Specialists", val: "250+" },
      { label: "Verified", val: "Licensed" },
      { label: "Location", val: "Nearby" }
    ],
    ctaText: "Find Doctors Nearby",
    ctaLink: "/doctors",
    badge: "LOCAL CARE",
    icon: ShieldCheck
  }
];

export default function StackingCardsSection() {
  return (
    <section className="relative py-24 bg-[#FFFFFF] dark:bg-[#0F172A] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="label-eyebrow text-[#3AAE6F] block mb-3">
              HOW IT WORKS FOR YOU • 01 — 04
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#4A4A4A] dark:text-slate-100 max-w-xl uppercase leading-tight">
              YOUR SIMPLE PATH TO GREAT HEALTH
            </h2>
          </div>
          <p className="text-base text-[#4A4A4A]/80 dark:text-slate-300 max-w-md leading-relaxed font-medium">
            Discover how personalized food choices, healthy recipes, and easy cooking tips help you feel your best every single day.
          </p>
        </div>

        {/* Scroll Stacking Deck Container */}
        <div className="relative space-y-12 pb-16">
          {CARDS_DATA.map((card, idx) => (
            <div
              key={card.num}
              className="sticky top-28 transition-all duration-500"
              style={{
                zIndex: idx + 1,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="group relative bg-[#DCEBD8] dark:bg-slate-900 rounded-[28px] p-8 sm:p-12 border border-[#3AAE6F]/20 dark:border-slate-800 card-stack-shadow hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Yellow Accent Corner Badge */}
                <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-[#F4B942] text-[#4A4A4A] px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm">
                  {card.badge}
                </div>

                <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center">
                  {/* Left Text Block */}
                  <div className="space-y-6">
                    {/* Large Lightweight Numeral + Category */}
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-5xl sm:text-6xl font-light text-[#3AAE6F] opacity-90 tracking-tighter">
                        {card.num}
                      </span>
                      <span className="label-eyebrow text-[#4A4A4A]/70 dark:text-slate-400">
                        {card.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#4A4A4A] dark:text-slate-100 leading-tight">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-[#4A4A4A]/90 dark:text-slate-300 leading-relaxed max-w-xl">
                      {card.description}
                    </p>

                    {/* Macro / Metric Badges */}
                    <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
                      {card.macros.map((m, i) => (
                        <div
                          key={i}
                          className="bg-[#FFFFFF] dark:bg-slate-800 rounded-2xl p-3 border border-[#3AAE6F]/15 dark:border-slate-700 text-center shadow-xs"
                        >
                          <div className="text-[10px] uppercase tracking-wider text-[#4A4A4A]/60 dark:text-slate-400 font-semibold mb-0.5">
                            {m.label}
                          </div>
                          <div className="font-display text-base font-bold text-[#3AAE6F]">
                            {m.val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA Link */}
                    <div className="pt-4">
                      <Link
                        to={card.ctaLink}
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#3AAE6F] text-[#FFFFFF] font-bold text-sm btn-green-primary"
                      >
                        <span>{card.ctaText}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Graphical Visual / Illustration Card */}
                  <div className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl bg-[#FFFFFF] dark:bg-slate-800/90 p-6 border border-[#3AAE6F]/20 dark:border-slate-700 flex flex-col justify-between shadow-inner overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#DCEBD8]/40 dark:from-[#3AAE6F]/10 to-transparent pointer-events-none" />

                    <div className="flex justify-between items-center z-10">
                      <div className="w-10 h-10 rounded-xl bg-[#3AAE6F]/10 dark:bg-[#3AAE6F]/20 text-[#3AAE6F] flex items-center justify-center">
                        <card.icon className="w-5 h-5" />
                      </div>
                      <Sparkles className="w-5 h-5 text-[#F4B942]" />
                    </div>

                    <div className="z-10 space-y-2">
                      <div className="inline-block px-3 py-1 bg-[#DCEBD8] dark:bg-slate-700/80 rounded-full text-xs font-semibold text-[#3AAE6F] dark:text-[#3AAE6F]">
                        Your Daily Health Balance
                      </div>
                      <div className="font-display text-xl font-bold text-[#4A4A4A] dark:text-slate-100">
                        {card.title}
                      </div>
                      <div className="w-full bg-[#DCEBD8] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#3AAE6F] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${(idx + 1) * 23 + 8}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
