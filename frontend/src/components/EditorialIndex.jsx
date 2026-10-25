import { motion } from "framer-motion";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const STAGES = [
  {
    n: "01",
    label: "HEALTH QUIZ",
    title: "Tell Us About Your Habits",
    detail: "Answer quick questions about your food intake, daily energy, and routine in under 3 minutes.",
    tag: "3 MIN QUIZ"
  },
  {
    n: "02",
    label: "NUTRIENT CHECK",
    title: "Spot What Your Body Needs",
    detail: "Calculates if you are low on key nutrients like Iron, Vitamin D, B12, Calcium, or Zinc.",
    tag: "EASY RESULTS"
  },
  {
    n: "03",
    label: "COOKING SECRETS",
    title: "Get More From Every Meal",
    detail: "Shows how simple cooking methods like steaming or raw eating preserve natural vitamins.",
    tag: "COOKING TIPS"
  },
  {
    n: "04",
    label: "PERSONAL PLAN",
    title: "Your Easy Health Guide",
    detail: "Delivers simple recipes, smart food pairings, and recommended dietitians near you.",
    tag: "DAILY MEALS"
  }
];

export default function EditorialIndex() {
  return (
    <section className="py-28 bg-[#DCEBD8]/60 dark:bg-slate-900/60 border-y border-[#3AAE6F]/15 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <span className="label-eyebrow text-[#3AAE6F] block mb-3">
            YOUR 4-STEP HEALTH JOURNEY
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#4A4A4A] dark:text-slate-100 tracking-tight uppercase leading-tight">
            FROM QUICK QUIZ TO DAILY VITALITY
          </h2>
        </div>

        {/* 4-Stage Editorial Index Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAGES.map((stage, idx) => (
            <motion.div
              key={stage.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[#FFFFFF] dark:bg-slate-900 rounded-[24px] p-8 border border-[#3AAE6F]/20 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group"
            >
              <div>
                {/* Large Lightweight Numeral */}
                <div className="flex justify-between items-start mb-6">
                  <span className="font-display text-5xl font-extralight text-[#3AAE6F]/80 group-hover:text-[#3AAE6F] transition-colors">
                    {stage.n}
                  </span>
                  <span className="bg-[#DCEBD8] dark:bg-slate-800 text-[#3AAE6F] dark:text-[#3AAE6F] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                    {stage.tag}
                  </span>
                </div>

                <span className="label-eyebrow text-[#4A4A4A]/60 dark:text-slate-400 block mb-2">
                  {stage.label}
                </span>

                <h3 className="font-display text-xl font-bold text-[#4A4A4A] dark:text-slate-100 mb-3 leading-snug">
                  {stage.title}
                </h3>

                <p className="text-sm text-[#4A4A4A]/80 dark:text-slate-300 leading-relaxed">
                  {stage.detail}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#DCEBD8] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#3AAE6F]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#F4B942]" /> Easy Step
                </span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Strip */}
        <div className="mt-16 bg-[#FFFFFF] dark:bg-slate-900 rounded-2xl p-8 border border-[#3AAE6F]/20 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h4 className="font-display text-xl font-bold text-[#4A4A4A] dark:text-slate-100">Ready to discover your personalized health plan?</h4>
            <p className="text-sm text-[#4A4A4A]/80 dark:text-slate-300 mt-1">Take the 3-minute health quiz today. 100% free.</p>
          </div>
          <Link
            to="/profile"
            className="px-8 py-3.5 rounded-full bg-[#3AAE6F] text-[#FFFFFF] font-bold text-sm btn-green-primary whitespace-nowrap"
          >
            Start Health Quiz →
          </Link>
        </div>
      </div>
    </section>
  );
}
