import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Smooth progress simulation over ~2.5 seconds, then 1.0s comfortable reading hold
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (onFinishRef.current) onFinishRef.current();
          }, 1000);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5 + 4);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Letter stagger animation variants with deliberate, pleasant timing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.5
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.5 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 18
      }
    }
  };

  const brandLetters = ["A", "l", "t", "e", "r", "a", "V", "i", "e"];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.04,
        filter: "blur(14px)",
        transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
      }}
      className="fixed inset-0 z-[9999] bg-[#FFFFFF] dark:bg-[#0F172A] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Background Soft Organic Glow Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.7, 0.4],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[520px] h-[520px] rounded-full bg-[#DCEBD8] blur-3xl -z-10"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[360px] h-[360px] rounded-full bg-[#F4B942]/20 blur-2xl -z-10"
      />

      {/* Main Animated Emblem Container */}
      <div className="relative flex flex-col items-center justify-center space-y-8">
        
        {/* DYNAMIC SVG LOGO WITH DRAWING PATHS & SPARKLES */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          
          {/* Rotating Outer Pulse Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-[#3AAE6F]/40"
          />

          {/* Yellow Sparkle Particle Accents */}
          <motion.div
            animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-2 text-[#F4B942]"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </motion.div>

          <motion.div
            animate={{ scale: [1, 0.7, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute -bottom-1 -left-2 text-[#F4B942]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </motion.div>

          {/* Core Logo Vector (Leaf + Bowl Crest) */}
          <motion.svg
            viewBox="0 0 120 120"
            className="w-32 h-32 drop-shadow-xl"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            {/* Background Crest Pill */}
            <rect x="10" y="10" width="100" height="100" rx="32" fill="#DCEBD8" />
            
            {/* Organic Bowl Curve */}
            <motion.path
              d="M30 65C30 90 50 100 60 100C70 100 90 90 90 65H30Z"
              fill="#FFFFFF"
              stroke="#4A4A4A"
              strokeWidth="4"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {/* Glowing Green Leaf sprouting upwards */}
            <motion.path
              d="M60 25C40 40 45 70 60 65C75 70 80 40 60 25Z"
              fill="#3AAE6F"
              stroke="#4A4A4A"
              strokeWidth="3.5"
              strokeLinejoin="round"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.6, type: "spring", stiffness: 180 }}
            />

            {/* Center Leaf Vein */}
            <motion.path
              d="M60 32V60"
              stroke="#DCEBD8"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            />

            {/* Yellow Accent Seed Dots */}
            <motion.circle
              cx="44"
              cy="60"
              r="4.5"
              fill="#F4B942"
              stroke="#4A4A4A"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, delay: 1.25 }}
            />
            <motion.circle
              cx="76"
              cy="60"
              r="4.5"
              fill="#F4B942"
              stroke="#4A4A4A"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, delay: 1.4 }}
            />
          </motion.svg>
        </div>

        {/* STAGGERED BRAND NAME REVEAL */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center space-x-1.5 sm:space-x-2"
        >
          {brandLetters.map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className={`font-display text-4xl sm:text-6xl font-extrabold tracking-tight ${
                char === "V" || char === "A" ? "text-[#3AAE6F]" : "text-[#4A4A4A] dark:text-slate-100"
              }`}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* SUBTITLE LETTER-SPACED TAG */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-[#F4B942] animate-ping" />
          <span className="font-heading text-xs sm:text-sm font-bold text-[#3AAE6F] uppercase tracking-[0.3em]">
            ORGANIC HEALTH & VITALITY
          </span>
          <span className="w-2 h-2 rounded-full bg-[#F4B942] animate-ping" />
        </motion.div>

        {/* PROGRESS BAR & COUNTER */}
        <div className="w-64 space-y-2.5 pt-2">
          <div className="h-2.5 w-full bg-[#DCEBD8] dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-[#3AAE6F]/20 dark:border-slate-700 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-[#3AAE6F] via-[#3AAE6F] to-[#F4B942] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ ease: "easeInOut", duration: 0.25 }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-[#4A4A4A]/70 dark:text-slate-300 font-mono tracking-wider">
            <span>PREPARING FRESH EXPERIENCE</span>
            <span className="text-[#3AAE6F] font-extrabold">{Math.min(progress, 100)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
