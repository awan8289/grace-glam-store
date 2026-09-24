'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Great_Vibes } from 'next/font/google';

const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'] });

const loadingTexts = [
  "Discovering Elegance...",
  "Curating Modest Fashion...",
  "Preparing Your Wardrobe...",
  "Unveiling the Finest Collection...",
  "Make a style with us, Grace & Glam."
];

// Floating orb positions (static so SSR-safe)
const orbs = [
  { width: 420, height: 420, top: -10, left: -10, opacity: 0.18, dur: 10 },
  { width: 320, height: 320, top: 55, left: 70, opacity: 0.1, dur: 14 },
];

// Gold shimmer particles
const particles = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: (i * 4.5) % 100,
  animDelay: (i * 0.38) % 4,
  size: i % 3 === 0 ? 4 : i % 3 === 1 ? 2.5 : 3.5,
}));

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setIndex((prev) => {
        if (prev < loadingTexts.length - 1) return prev + 1;
        clearInterval(textInterval);
        return prev;
      });
    }, 700);

    const finishTimeout = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearInterval(textInterval);
      clearTimeout(finishTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 sm:px-8 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 40%, #0f1f14 70%, #0a0f1e 100%)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(18px)" }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* ====== Animated Deep-Space Orbs ====== */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${orb.width}px`,
            height: `${orb.height}px`,
            top: `${orb.top}%`,
            left: `${orb.left}%`,
            background: `radial-gradient(circle, rgba(211,169,93,${orb.opacity}) 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [orb.opacity, orb.opacity * 1.6, orb.opacity],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7,
          }}
        />
      ))}

      {/* ====== Rising Gold Particles ====== */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            bottom: "-10px",
            background: "rgba(211,169,93,0.85)",
            boxShadow: "0 0 6px 2px rgba(211,169,93,0.4)",
          }}
          animate={{
            y: [0, -900],
            opacity: [0, 0.9, 0],
            x: [0, p.id % 2 === 0 ? 20 : -20],
          }}
          transition={{
            duration: 5 + (p.id % 4),
            repeat: Infinity,
            delay: p.animDelay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* ====== Diagonal Light Sweep ====== */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 35%, rgba(211,169,93,0.06) 50%, transparent 65%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
      />

      {/* ====== Brand Monogram ====== */}
      <motion.div
        className="relative mb-10 flex flex-col items-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Outer ring */}
        <motion.div
          className="w-20 h-20 rounded-full border border-[#d3a95d]/40 flex items-center justify-center relative mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          {/* Dashed inner ring */}
          <div
            className="absolute inset-2 rounded-full"
            style={{ border: "1px dashed rgba(211,169,93,0.25)" }}
          />
          {/* Monogram */}
          <span className="text-[#d3a95d] font-serif font-bold text-xl tracking-tighter z-10">G&G</span>
        </motion.div>

        {/* Brand name */}
        <motion.p
          className="text-[#d3a95d]/80 text-xs tracking-[0.5em] uppercase font-light"
          initial={{ opacity: 0, letterSpacing: "0.8em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.5, delay: 0.4 }}
        >
          Grace &amp; Glam
        </motion.p>
      </motion.div>

      {/* ====== Rotating Text ====== */}
      <div className="h-20 flex items-center justify-center mb-12 text-center relative">
        <AnimatePresence mode="wait">
          <motion.h1
            key={index}
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.7 }}
            className={`${greatVibes.className} text-white tracking-wide text-3xl sm:text-4xl md:text-5xl lg:text-6xl px-2`}
          >
            {loadingTexts[index]}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* ====== Gold Progress Bar ====== */}
      <div className="w-full max-w-[280px] sm:max-w-[380px] relative">
        {/* Track */}
        <div className="h-[2px] bg-white/10 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #8a6d3b, #d3a95d, #f0d090, #d3a95d)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.4, ease: "linear" }}
          />
          {/* Shimmer on bar */}
          <motion.div
            className="absolute inset-y-0 w-16 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
            animate={{ left: ["-20%", "120%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Percentage label */}
        <motion.p
          className="text-center text-[#d3a95d]/60 font-sans text-xs tracking-[0.3em] mt-5 uppercase"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading your exclusive collection
        </motion.p>

        <button
          type="button"
          onClick={onComplete}
          className="mx-auto mt-6 block text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}
