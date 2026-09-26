"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, AlertCircle, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/types";

interface NecklaceCustomizerProps {
  product: Product;
  baseImage?: string;
  onAddToCart?: (customText: string, material: string) => void;
}

const MATERIALS = [
  { id: "gold", name: "18K Gold Plated", hex: "#D4AF37", fontGradient: "from-[#FBE8A6] via-[#D4AF37] to-[#AA7C11]", shadow: "rgba(212, 175, 55, 0.4)" },
  { id: "silver", name: "Sterling Silver", hex: "#C0C0C0", fontGradient: "from-[#FFFFFF] via-[#D8D8D8] to-[#999999]", shadow: "rgba(192, 192, 192, 0.4)" },
  { id: "rose", name: "Rose Gold", hex: "#B76E79", fontGradient: "from-[#FAD0C4] via-[#E8989E] to-[#B76E79]", shadow: "rgba(183, 110, 121, 0.4)" },
];

export default function NecklaceCustomizer({ product, baseImage, onAddToCart }: NecklaceCustomizerProps) {
  const [nameText, setNameText] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [chainLength, setChainLength] = useState("45cm (Standard)");
  const [isAdded, setIsAdded] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const { addItem, openCart } = useCartStore();

  const maxChars = 12;
  const currentPreviewName = nameText.trim() || "Your Name";

  const handleAdd = () => {
    if (!nameText.trim()) return;

    // Add to cart with custom text: (product, selectedSize, selectedColor, quantity)
    addItem(product, chainLength, selectedMaterial.name, 1);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 800);

    onAddToCart?.(nameText.trim(), selectedMaterial.name);
  };

  return (
    <div className="w-full bg-[#fbfaf8] border border-[#e8e4dc] rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] bg-[#faf4e6] px-3 py-1 rounded-full border border-[#d4af37]/30">
            Live Atelier Customizer
          </span>
          <h3 className="text-xl font-serif text-[#1a1a1a] mt-2 font-medium">Personalized Name Necklace</h3>
        </div>
        <Sparkles className="w-5 h-5 text-[#d4af37]" />
      </div>

      {/* ── Interactive Live Preview Canvas / Visualizer ── */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-[#222] to-[#111] shadow-inner flex items-center justify-center border border-black/10">
        {/* Subtle Luxury Velvet Background or Product Base */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Chain graphics representation */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
          <path
            d="M 50,0 Q 200,160 350,0"
            fill="none"
            stroke={selectedMaterial.hex}
            strokeWidth="1.5"
            strokeDasharray="2,2"
            opacity="0.75"
          />
        </svg>

        {/* Dynamic Name Pendant Overlay */}
        <motion.div
          ref={textRef}
          key={`${nameText}-${selectedMaterial.id}`}
          initial={{ scale: 0.96, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 text-center select-none pt-12"
        >
          <span
            className={`font-serif italic text-3xl sm:text-4xl md:text-5xl tracking-wide bg-gradient-to-r ${selectedMaterial.fontGradient} bg-clip-text text-transparent drop-shadow-[0_4px_10px_${selectedMaterial.shadow}] transition-all duration-300 inline-block`}
            style={{
              fontFamily: "'Playfair Display', 'Brush Script MT', Georgia, cursive, serif",
              textShadow: `0 0 12px ${selectedMaterial.shadow}, 0 2px 4px rgba(0,0,0,0.8)`,
            }}
          >
            {currentPreviewName}
          </span>

          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-4 font-mono"
          >
            ✦ Real-Time Inscription Preview ✦
          </motion.div>
        </motion.div>

        {/* Material Badge */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 font-mono tracking-wider border border-white/10">
          {selectedMaterial.name}
        </div>
      </div>

      {/* ── Input Controls ── */}
      <div className="mt-6 space-y-5">
        {/* Name input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Enter Custom Inscription Name
            </label>
            <span className={`text-[11px] font-mono ${nameText.length >= maxChars ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {nameText.length}/{maxChars}
            </span>
          </div>
          <input
            type="text"
            maxLength={maxChars}
            value={nameText}
            onChange={(e) => setNameText(e.target.value)}
            placeholder="e.g. Sophia, Grace, Noor"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none text-base text-black transition-all"
          />
        </div>

        {/* Material selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Pendant Metal & Finish
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {MATERIALS.map((mat) => (
              <button
                key={mat.id}
                type="button"
                onClick={() => setSelectedMaterial(mat)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedMaterial.id === mat.id
                    ? "border-[#d4af37] bg-[#faf6ed] text-[#111] shadow-sm font-semibold"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: mat.hex }} />
                <span>{mat.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chain Length */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Chain Length
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {["40cm (Choker)", "45cm (Standard)", "50cm (Princess)"].map((length) => (
              <button
                key={length}
                type="button"
                onClick={() => setChainLength(length)}
                className={`py-2 px-2 text-center rounded-xl border text-xs transition-all cursor-pointer ${
                  chainLength === length
                    ? "border-[#111] bg-[#111] text-white font-medium"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {length.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!nameText.trim() || isAdded}
          className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            !nameText.trim()
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : isAdded
              ? "bg-green-600 text-white"
              : "bg-[#111] text-white hover:bg-[#d4af37] hover:text-black"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" /> Customized & Added to Bag
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" /> Add Customized Necklace to Bag
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center font-mono">
          Handcrafted individually in Australia • 12-hour spelling change window
        </p>
      </div>
    </div>
  );
}
