import { motion } from "framer-motion";

export default function HeroBowl({ startAnimation = true }) {
  const animateState = startAnimation ? "visible" : "hidden";

  // Container variants
  const bowlContainerVariants = {
    hidden: { scale: 0.8, opacity: 0, y: 50 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.175, 0.885, 0.32, 1.2],
        delay: 0.2
      }
    }
  };

  // Ingredient spring variants
  const ingredientVariants = (customDelay, startRotate = -20) => ({
    hidden: { opacity: 0, scale: 0.2, y: -40, rotate: startRotate },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0,
      transition: {
        delay: customDelay + 0.3,
        duration: 0.6,
        type: "spring",
        stiffness: 260,
        damping: 18
      }
    }
  });

  // Sparkle glow variant
  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 0.8, 1, 0],
      scale: [0, 1.2, 1, 1.1, 0],
      transition: {
        delay: 1.8,
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="relative w-full max-w-[460px] aspect-square mx-auto flex items-center justify-center p-4">
      {/* Soft Glow Background Pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={startAnimation ? { opacity: [0, 0.6, 0.35], scale: [0.8, 1.1, 1] } : { opacity: 0 }}
        transition={{ duration: 1.6, delay: 0.2, ease: "easeOut" }}
        className="absolute inset-4 rounded-full bg-[#DCEBD8]/80 blur-2xl -z-10"
      />

      {/* Floating Sparkle Elements */}
      <motion.div
        variants={sparkleVariants}
        initial="hidden"
        animate={animateState}
        className="absolute top-6 right-8 text-[#F4B942] z-20 pointer-events-none"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </motion.div>

      <motion.div
        variants={sparkleVariants}
        initial="hidden"
        animate={animateState}
        className="absolute bottom-12 left-6 text-[#F4B942] z-20 pointer-events-none"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </motion.div>

      {/* Main Bowl SVG Illustration */}
      <motion.div
        className="w-full h-full"
        animate={startAnimation ? {
          y: [-4, 4, -4],
          rotate: [-0.6, 0.6, -0.6]
        } : {}}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.2
        }}
      >
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl"
        >
          {/* Shadow beneath bowl */}
          <motion.ellipse
            cx="250"
            cy="425"
            rx="160"
            ry="22"
            fill="#4A4A4A"
            opacity="0.12"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={startAnimation ? { scale: 1, opacity: 0.12 } : { scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* BOWL BASE CONTAINER */}
          <motion.g
            variants={bowlContainerVariants}
            initial="hidden"
            animate={animateState}
          >
            {/* Outer Ceramic Bowl Body */}
            <path
              d="M80 230C80 345 150 410 250 410C350 410 420 345 420 230H80Z"
              fill="#FFFFFF"
              stroke="#4A4A4A"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Bowl Base Ring */}
            <path
              d="M190 405C190 415 215 422 250 422C285 422 310 415 310 405"
              stroke="#4A4A4A"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Interior Bowl Depth Fill (#DCEBD8 Sage/Mint) */}
            <ellipse
              cx="250"
              cy="230"
              rx="170"
              ry="55"
              fill="#DCEBD8"
              stroke="#4A4A4A"
              strokeWidth="6"
            />
            {/* Bowl Accent Line */}
            <path
              d="M100 245C140 275 360 275 400 245"
              stroke="#3AAE6F"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.5"
            />
          </motion.g>

          {/* INGREDIENTS (ANIMATE INTO BOWL ONE BY ONE) */}

          {/* 1. Kale & Spinach Greens Base */}
          <motion.g
            custom={0.4}
            variants={ingredientVariants(0.4, -25)}
            initial="hidden"
            animate={animateState}
          >
            <path
              d="M140 220C120 180 160 150 200 185C230 160 270 180 260 215C220 245 160 240 140 220Z"
              fill="#3AAE6F"
              stroke="#4A4A4A"
              strokeWidth="3.5"
            />
            <path
              d="M170 200C195 210 225 215 240 210"
              stroke="#DCEBD8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.g>

          {/* 2. Avocado Slices */}
          <motion.g
            custom={0.65}
            variants={ingredientVariants(0.65, 30)}
            initial="hidden"
            animate={animateState}
          >
            {/* Outer Avocado 1 */}
            <path
              d="M260 200C250 160 290 140 330 170C360 195 330 235 290 225Z"
              fill="#3AAE6F"
              stroke="#4A4A4A"
              strokeWidth="3.5"
            />
            {/* Inner Avocado Cream */}
            <path
              d="M272 198C265 170 292 152 320 175C340 193 320 222 292 216Z"
              fill="#DCEBD8"
            />
            {/* Avocado Seed outline spot */}
            <ellipse cx="305" cy="190" rx="10" ry="12" fill="#F4B942" opacity="0.8" />
          </motion.g>

          {/* 3. Strawberry Slices */}
          <motion.g
            custom={0.9}
            variants={ingredientVariants(0.9, -15)}
            initial="hidden"
            animate={animateState}
          >
            <path
              d="M190 230C170 210 185 175 215 190C240 205 225 245 190 230Z"
              fill="#F4B942"
              stroke="#4A4A4A"
              strokeWidth="3.5"
            />
            {/* Strawberry Seed Accents */}
            <circle cx="198" cy="205" r="2" fill="#4A4A4A" />
            <circle cx="210" cy="215" r="2" fill="#4A4A4A" />
            <circle cx="205" cy="198" r="2" fill="#4A4A4A" />
          </motion.g>

          {/* 4. Lemon / Citrus Wheel */}
          <motion.g
            custom={1.15}
            variants={ingredientVariants(1.15, 45)}
            initial="hidden"
            animate={animateState}
          >
            <circle cx="340" cy="225" r="32" fill="#F4B942" stroke="#4A4A4A" strokeWidth="3.5" />
            <circle cx="340" cy="225" r="25" fill="#FFFFFF" />
            <circle cx="340" cy="225" r="21" fill="#F4B942" opacity="0.9" />
            <path d="M340 204V246M319 225H361M325 210L355 240M325 240L355 210" stroke="#FFFFFF" strokeWidth="2" />
          </motion.g>

          {/* 5. Cherry Tomato */}
          <motion.g
            custom={1.4}
            variants={ingredientVariants(1.4, -20)}
            initial="hidden"
            animate={animateState}
          >
            <circle cx="245" cy="245" r="22" fill="#3AAE6F" opacity="0.15" />
            <circle cx="245" cy="240" r="20" fill="#F4B942" stroke="#4A4A4A" strokeWidth="3.5" />
            <path d="M245 220C242 225 238 226 245 228C252 226 248 225 245 220Z" fill="#3AAE6F" stroke="#4A4A4A" strokeWidth="2" />
          </motion.g>

          {/* 6. Sprinkled Seeds & Nuts (Micro elements) */}
          <motion.g
            custom={1.6}
            variants={{
              hidden: { opacity: 0, scale: 0 },
              visible: { opacity: 1, scale: 1, transition: { delay: 1.8, duration: 0.4 } }
            }}
            initial="hidden"
            animate={animateState}
          >
            <ellipse cx="160" cy="240" rx="4" ry="2" fill="#4A4A4A" transform="rotate(30 160 240)" />
            <ellipse cx="280" cy="250" rx="4" ry="2" fill="#4A4A4A" transform="rotate(-20 280 250)" />
            <ellipse cx="320" cy="255" rx="5" ry="3" fill="#F4B942" stroke="#4A4A4A" strokeWidth="1" transform="rotate(15 320 255)" />
            <ellipse cx="220" cy="255" rx="4" ry="2" fill="#4A4A4A" transform="rotate(45 220 255)" />
            <circle cx="175" cy="225" r="3" fill="#FFFFFF" stroke="#3AAE6F" strokeWidth="1.5" />
            <circle cx="310" cy="245" r="3" fill="#FFFFFF" stroke="#3AAE6F" strokeWidth="1.5" />
          </motion.g>

          {/* Soft Highlight Shine on Bowl Front */}
          <path
            d="M105 260C110 320 150 380 230 395"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </motion.div>
    </div>
  );
}
