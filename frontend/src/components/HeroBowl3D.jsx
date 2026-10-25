import { useState, useRef } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { Sparkles, Flame, ShieldCheck, HeartPulse } from "lucide-react";

export default function HeroBowl3D() {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tilt animation physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), {
    stiffness: 250,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), {
    stiffness: 250,
    damping: 25,
  });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const currentMouseX = (e.clientX - rect.left) / width - 0.5;
    const currentMouseY = (e.clientY - rect.top) / height - 0.5;

    mouseX.set(currentMouseX);
    mouseY.set(currentMouseY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[460px] aspect-square mx-auto flex items-center justify-center p-2 sm:p-4 cursor-pointer perspective-1000"
      style={{ perspective: "1000px" }}
    >
      {/* 3D Rotating Wrapper */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          y: isHovered ? -8 : [-5, 5, -5],
        }}
        transition={{
          y: isHovered
            ? { duration: 0.3 }
            : { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Soft Radial Ambient Glow */}
        <div
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#3AAE6F]/30 via-[#DCEBD8]/50 to-[#F4B942]/20 blur-3xl -z-10 transition-opacity duration-300"
          style={{ opacity: isHovered ? 0.95 : 0.6 }}
        />

        {/* Outer Orbit Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-dashed border-[#3AAE6F]/25 pointer-events-none"
        />

        {/* FLOATING 3D MACRO BADGES */}

        {/* 1. Top-Left: Protein Badge */}
        <motion.div
          style={{ transform: "translateZ(55px)" }}
          animate={isHovered ? { scale: 1.08, y: -4 } : { y: [-2, 3, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 left-2 sm:left-4 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-[#3AAE6F]/30 flex items-center gap-1.5 text-xs font-extrabold text-[#278657] dark:text-emerald-400"
        >
          <span className="w-5 h-5 rounded-full bg-[#3AAE6F] text-white flex items-center justify-center text-[10px]">
            🥗
          </span>
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Macro</span>
            <span className="text-xs">24g Protein</span>
          </div>
        </motion.div>

        {/* 2. Top-Right: Iron Badge */}
        <motion.div
          style={{ transform: "translateZ(65px)" }}
          animate={isHovered ? { scale: 1.08, y: -4 } : { y: [3, -3, 3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-8 right-1 sm:right-2 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400"
        >
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
            🩸
          </span>
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Micronutrient</span>
            <span className="text-xs">4.8mg Iron</span>
          </div>
        </motion.div>

        {/* 3. Bottom-Left: Vitamin D Badge */}
        <motion.div
          style={{ transform: "translateZ(45px)" }}
          animate={isHovered ? { scale: 1.08, y: 4 } : { y: [-3, 2, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1 sm:left-3 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-900 flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400"
        >
          <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
            ☀️
          </span>
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Sun Power</span>
            <span className="text-xs">600 IU Vit D</span>
          </div>
        </motion.div>

        {/* 4. Bottom-Right: Score Badge */}
        <motion.div
          style={{ transform: "translateZ(60px)" }}
          animate={isHovered ? { scale: 1.08, y: 4 } : { y: [2, -2, 2] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 right-2 sm:right-4 z-30 bg-gradient-to-r from-[#3AAE6F] to-emerald-600 text-white px-3.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-1.5 text-xs font-extrabold"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>98.4% Match</span>
        </motion.div>

        {/* MAIN 3D BOWL SVG CONTAINER */}
        <div style={{ transform: "translateZ(25px)" }} className="w-full h-full">
          <svg
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-2xl"
          >
            {/* Dynamic Shadow Beneath Bowl */}
            <ellipse
              cx="250"
              cy="435"
              rx="155"
              ry="20"
              fill="#0F172A"
              opacity={isHovered ? 0.25 : 0.15}
              className="transition-opacity duration-300"
            />

            {/* BOWL CERAMIC BASE */}
            <g>
              {/* Outer Deep Bowl Shadow */}
              <path
                d="M75 225C75 350 145 418 250 418C355 418 425 350 425 225H75Z"
                fill="url(#bowlOuterGradient)"
                stroke="#1E293B"
                strokeWidth="5"
              />

              {/* Bowl Bottom Base Ring */}
              <path
                d="M185 412C185 424 212 432 250 432C288 432 315 424 315 412"
                stroke="#1E293B"
                strokeWidth="4.5"
                strokeLinecap="round"
              />

              {/* Bowl Interior Rim Surface (Sage Green Depth Fill) */}
              <ellipse
                cx="250"
                cy="225"
                rx="175"
                ry="58"
                fill="url(#bowlInnerGradient)"
                stroke="#1E293B"
                strokeWidth="5"
              />

              {/* Bowl Gloss Highlight Curve */}
              <path
                d="M100 250C130 320 180 395 240 405"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.65"
              />
            </g>

            {/* LAYERED INGREDIENTS (3D FOOD COMPOSITION) */}

            {/* 1. Base Quinoa & Fresh Leafy Kale Bed */}
            <g>
              <path
                d="M125 215C105 175 145 140 190 180C225 150 270 175 260 215C215 245 150 240 125 215Z"
                fill="#3AAE6F"
                stroke="#1E293B"
                strokeWidth="3.5"
              />
              <path
                d="M155 195C180 208 215 212 235 208"
                stroke="#DCEBD8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M210 218C190 235 240 242 275 220C300 200 320 230 280 242Z"
                fill="#278657"
                stroke="#1E293B"
                strokeWidth="3"
              />
            </g>

            {/* 2. Seared Salmon & Tofu Cubes */}
            <g>
              {/* Salmon Fillet Slice */}
              <path
                d="M260 180C250 145 295 135 340 160C370 185 340 230 295 215Z"
                fill="#F472B6"
                stroke="#1E293B"
                strokeWidth="3.5"
              />
              {/* Salmon Stripes */}
              <path d="M280 165L325 180M290 180L335 195" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.8" />

              {/* Tofu Cube 1 */}
              <rect x="210" y="195" width="28" height="24" rx="4" fill="#FEF3C7" stroke="#1E293B" strokeWidth="3" transform="rotate(-12 210 195)" />
              {/* Tofu Cube 2 */}
              <rect x="235" y="215" width="26" height="22" rx="4" fill="#FFFBEB" stroke="#1E293B" strokeWidth="3" transform="rotate(18 235 215)" />
            </g>

            {/* 3. Sliced Avocado & Edamame Pods */}
            <g>
              {/* Avocado Slice 1 */}
              <path
                d="M165 210C150 180 180 160 210 185C230 205 205 235 180 230Z"
                fill="#84CC16"
                stroke="#1E293B"
                strokeWidth="3.5"
              />
              <path d="M175 205C168 188 188 175 205 190Z" fill="#ECFCCB" />

              {/* Avocado Slice 2 */}
              <path
                d="M185 220C170 195 195 180 220 200C238 218 218 242 195 238Z"
                fill="#65A30D"
                stroke="#1E293B"
                strokeWidth="3.5"
              />
            </g>

            {/* 4. Citrus Lemon Wheel & Cherry Tomatoes */}
            <g>
              {/* Lemon Wheel */}
              <circle cx="345" cy="215" r="32" fill="#F4B942" stroke="#1E293B" strokeWidth="3.5" />
              <circle cx="345" cy="215" r="25" fill="#FFFFFF" />
              <circle cx="345" cy="215" r="20" fill="#FBBF24" />
              <path d="M345 195V235M325 215H365M331 201L359 229M331 229L359 201" stroke="#FFFFFF" strokeWidth="2" />

              {/* Cherry Tomatoes */}
              <circle cx="285" cy="235" r="18" fill="#EF4444" stroke="#1E293B" strokeWidth="3.5" />
              <circle cx="280" cy="230" r="4" fill="#FFFFFF" opacity="0.6" />
              <circle cx="250" cy="245" r="16" fill="#DC2626" stroke="#1E293B" strokeWidth="3" />
            </g>

            {/* 5. Micro Sprinkles & Chia Seeds */}
            <g>
              <circle cx="170" cy="235" r="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1" />
              <circle cx="310" cy="240" r="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1" />
              <circle cx="230" cy="248" r="2.5" fill="#F4B942" />
              <ellipse cx="200" cy="242" rx="4" ry="2" fill="#1E293B" transform="rotate(30 200 242)" />
              <ellipse cx="270" cy="250" rx="4" ry="2" fill="#1E293B" transform="rotate(-25 270 250)" />
            </g>

            {/* GRADIENT DEFINITIONS */}
            <defs>
              <linearGradient id="bowlOuterGradient" x1="75" y1="225" x2="425" y2="418" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.7" stopColor="#F1F5F9" />
                <stop offset="1" stopColor="#E2E8F0" />
              </linearGradient>

              <linearGradient id="bowlInnerGradient" x1="75" y1="225" x2="425" y2="225" gradientUnits="userSpaceOnUse">
                <stop stopColor="#DCEBD8" />
                <stop offset="0.5" stopColor="#E9F5E6" />
                <stop offset="1" stopColor="#CBE4C5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
