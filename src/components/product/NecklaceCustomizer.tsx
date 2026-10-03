"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, Gift, ShieldCheck, Clock, ShoppingBag, Droplets } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/types";
import { formatPrice } from "@/lib/format";

interface NecklaceCustomizerProps {
  product: Product;
  onAddToCart?: (customText: string, material: string) => void;
}

const MATERIALS = [
  {
    id: "gold",
    name: "18K Gold-Plated",
    subtitle: "Over 316L Surgical Steel",
    hex: "#D4AF37",
    fontGradient: "from-[#FBE8A6] via-[#D4AF37] to-[#AA7C11]",
    shadow: "rgba(212, 175, 55, 0.45)",
    badge: "Most Popular",
  },
  {
    id: "silver",
    name: "Sterling Silver Finish",
    subtitle: "Rhodium-Shielded PVD",
    hex: "#E0E0E0",
    fontGradient: "from-[#FFFFFF] via-[#E0E0E0] to-[#999999]",
    shadow: "rgba(200, 200, 200, 0.45)",
    badge: "Classic",
  },
  {
    id: "rose",
    name: "18K Rose Gold",
    subtitle: "Warm Blush Tone",
    hex: "#B76E79",
    fontGradient: "from-[#FAD0C4] via-[#E8989E] to-[#B76E79]",
    shadow: "rgba(183, 110, 121, 0.45)",
    badge: "Romantic",
  },
];

const CHAIN_LENGTHS = [
  { id: "40cm", label: "40 cm", desc: "Choker / Collar" },
  { id: "45cm", label: "45 cm", desc: "Standard (Most Popular)", popular: true },
  { id: "50cm", label: "50 cm", desc: "Princess / Layering" },
];

export default function NecklaceCustomizer({ product, onAddToCart }: NecklaceCustomizerProps) {
  // Script mode: English cursive vs Arabic calligraphy
  const [script, setScript] = useState<"English" | "Arabic">("English");
  const [nameText, setNameText] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [chainLength, setChainLength] = useState("45 cm");

  // Upsell 1: Two-Name Bundle (20% OFF second necklace)
  const [isBundle, setIsBundle] = useState(false);
  const [secondaryName, setSecondaryName] = useState("");

  // Upsell 2: Luxury Velvet Gift Box (+A$9.95)
  const [hasGiftBox, setHasGiftBox] = useState(false);

  const [isAdded, setIsAdded] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const { addItem, openCart } = useCartStore();

  const maxChars = script === "Arabic" ? 14 : 12;
  const currentPreviewName = nameText.trim() || (script === "Arabic" ? "جمال" : "Sophia");

  // Dynamic delivery date calculation: 14 to 21 days from today
  const deliveryWindow = useMemo(() => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 14);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 21);

    const minFormatted = minDate.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
    const maxFormatted = maxDate.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
    return `${minFormatted} – ${maxFormatted}`;
  }, []);

  // Pricing calculations
  const basePrice = product.price;
  const bundleDiscount = 0.2; // 20% off 2nd
  const secondNecklacePrice = basePrice * (1 - bundleDiscount);
  const totalPrice = (isBundle ? basePrice + secondNecklacePrice : basePrice) + (hasGiftBox ? 9.95 : 0);
  const originalTotalPrice = (isBundle ? basePrice * 2 : basePrice) + (hasGiftBox ? 9.95 : 0);

  const handleAdd = () => {
    if (!nameText.trim()) return;
    if (isBundle && !secondaryName.trim()) return;

    addItem(
      product,
      chainLength,
      selectedMaterial.name,
      1,
      {
        customText: nameText.trim(),
        secondaryCustomText: isBundle ? secondaryName.trim() : undefined,
        script,
        chainLength,
        giftBox: hasGiftBox,
        isBundle,
        customPrice: isBundle ? basePrice + secondNecklacePrice : basePrice,
      }
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 700);

    onAddToCart?.(nameText.trim(), selectedMaterial.name);
  };

  return (
    <div className="w-full bg-[#fbfaf8] border border-[#e8e4dc] rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e8e4dc]/70">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#d4af37] bg-[#faf4e6] px-3 py-1 rounded-full border border-[#d4af37]/30 font-semibold inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Live Atelier Inscription
          </span>
          <h3 className="text-xl md:text-2xl font-serif text-[#1a1a1a] mt-2 font-medium">
            Custom Inscription Necklace
          </h3>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            {isBundle && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalTotalPrice)}
              </span>
            )}
            <span className="text-xl md:text-2xl font-serif font-bold text-[#b8860b]">
              {formatPrice(totalPrice)}
            </span>
          </div>
          {isBundle && (
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Save A${(basePrice * 0.2).toFixed(2)} with bundle
            </span>
          )}
        </div>
      </div>

      {/* ── Interactive Live Preview Canvas ── */}
      <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-b from-[#1c1b18] via-[#141311] to-[#0a0a09] shadow-2xl flex items-center justify-center border border-black/20">
        {/* Soft luxury lighting */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_30%,_var(--tw-gradient-stops))] from-amber-200/15 via-transparent to-transparent pointer-events-none" />

        {/* Chain graphic */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 250">
          <path
            d="M 60,-10 Q 200,140 340,-10"
            fill="none"
            stroke={selectedMaterial.hex}
            strokeWidth="1.8"
            strokeDasharray="3,3"
            opacity="0.8"
          />
        </svg>

        {/* Dynamic Name Inscription Overlay */}
        <motion.div
          ref={textRef}
          key={`${nameText}-${selectedMaterial.id}-${script}`}
          initial={{ scale: 0.94, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 text-center select-none pt-10 px-6 max-w-full"
        >
          <span
            dir={script === "Arabic" ? "rtl" : "ltr"}
            className={`text-3xl sm:text-4xl md:text-5xl tracking-wide bg-gradient-to-r ${selectedMaterial.fontGradient} bg-clip-text text-transparent inline-block drop-shadow-[0_4px_12px_${selectedMaterial.shadow}] transition-all duration-300 font-serif`}
            style={{
              fontFamily:
                script === "Arabic"
                  ? "'Amiri', 'Traditional Arabic', 'Scheherazade New', 'Times New Roman', serif"
                  : "'Playfair Display', 'Brush Script MT', Georgia, cursive, serif",
              fontStyle: script === "Arabic" ? "normal" : "italic",
              textShadow: `0 0 14px ${selectedMaterial.shadow}, 0 2px 4px rgba(0,0,0,0.9)`,
            }}
          >
            {currentPreviewName}
          </span>

          {isBundle && secondaryName.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-center"
            >
              <span className="text-[11px] text-white/50 uppercase tracking-widest font-mono mr-2">
                Matching:
              </span>
              <span
                dir={script === "Arabic" ? "rtl" : "ltr"}
                className={`text-xl sm:text-2xl tracking-wide bg-gradient-to-r ${selectedMaterial.fontGradient} bg-clip-text text-transparent font-serif italic`}
              >
                {secondaryName.trim()}
              </span>
            </motion.div>
          )}

          <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mt-3 font-mono">
            ✦ Precision Laser-Cut Inscription ✦
          </div>
        </motion.div>

        {/* Material & Chain Length Tag */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-amber-200/90 font-mono tracking-wider border border-amber-500/20">
          {selectedMaterial.name} • {chainLength}
        </div>

        {/* Script Badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 font-mono tracking-wider border border-white/10">
          {script === "Arabic" ? "خط عربي • Arabic Script" : "English Cursive Script"}
        </div>
      </div>

      {/* ── Customization Controls ── */}
      <div className="mt-6 space-y-6">
        {/* Step 1: Script Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            1. Select Script Style
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScript("English")}
              className={`py-3 px-4 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                script === "English"
                  ? "border-[#111] bg-[#111] text-white shadow-sm font-semibold"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="font-serif italic text-sm">Aa</span>
              <span>English Cursive Script</span>
            </button>
            <button
              type="button"
              onClick={() => setScript("Arabic")}
              className={`py-3 px-4 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                script === "Arabic"
                  ? "border-[#111] bg-[#111] text-white shadow-sm font-semibold"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="text-base font-serif">عربي</span>
              <span>Arabic Calligraphy (خط عربي)</span>
            </button>
          </div>
        </div>

        {/* Step 2: Name Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              2. Enter Custom Name Inscription
            </label>
            <span
              className={`text-[11px] font-mono ${
                nameText.length >= maxChars ? "text-red-500 font-bold" : "text-gray-400"
              }`}
            >
              {nameText.length}/{maxChars}
            </span>
          </div>
          <input
            type="text"
            maxLength={maxChars}
            dir={script === "Arabic" ? "rtl" : "ltr"}
            value={nameText}
            onChange={(e) => setNameText(e.target.value)}
            placeholder={
              script === "Arabic"
                ? "مثال: مريم، فاطمة، نور..."
                : "e.g. Sophia, Grace, Charlotte..."
            }
            className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none text-base text-black transition-all shadow-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            {script === "Arabic"
              ? "Type in Arabic or enter English name to have our calligraphers transcribe it."
              : "Standard capitalization (First letter capitalized, remaining lowercase)."}
          </p>
        </div>

        {/* Step 3: Finish & Material (Honest Australian Law Compliant) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              3. Select Finish &amp; Precious Coating
            </label>
            <span className="text-[10px] text-[#b8860b] font-medium flex items-center gap-1">
              <Droplets className="w-3 h-3" /> Non-Tarnish PVD Vacuum Plated
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {MATERIALS.map((mat) => (
              <button
                key={mat.id}
                type="button"
                onClick={() => setSelectedMaterial(mat)}
                className={`py-3 px-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  selectedMaterial.id === mat.id
                    ? "border-[#b8860b] bg-[#faf6ed] text-[#111] shadow-sm ring-1 ring-[#b8860b]/30"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: mat.hex }}
                  />
                  <span className="font-semibold text-xs text-black">{mat.name}</span>
                </div>
                <p className="text-[10px] text-gray-500 pl-6.5">{mat.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Chain Length */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            4. Select Chain Length
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {CHAIN_LENGTHS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setChainLength(item.label)}
                className={`py-2.5 px-2 text-center rounded-xl border transition-all cursor-pointer ${
                  chainLength === item.label
                    ? "border-[#111] bg-[#111] text-white font-semibold shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div
                  className={`text-[9px] mt-0.5 ${
                    chainLength === item.label ? "text-gray-300" : "text-gray-400"
                  }`}
                >
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── High-Margin Upsell #1: Two-Name Matching Bundle ── */}
        <div
          onClick={() => setIsBundle(!isBundle)}
          className={`rounded-2xl p-4 border-2 transition-all cursor-pointer ${
            isBundle
              ? "border-[#b8860b] bg-[#faf6ed]/50 shadow-sm"
              : "border-dashed border-gray-300 bg-white hover:border-[#b8860b]/60"
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="bundleCheckbox"
              checked={isBundle}
              onChange={(e) => setIsBundle(e.target.checked)}
              className="w-4 h-4 text-[#b8860b] rounded mt-0.5 cursor-pointer accent-[#b8860b]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-black">
                  Two-Name Matching Set (Mom + Daughter / Bestie Bundle)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                  SAVE 20% on 2nd
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Add a second personalized necklace in the same gift parcel for only{" "}
                <strong className="text-black">{formatPrice(secondNecklacePrice)}</strong>{" "}
                (Normally {formatPrice(basePrice)}).
              </p>

              {isBundle && (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Second Inscription Name
                  </label>
                  <input
                    type="text"
                    maxLength={maxChars}
                    dir={script === "Arabic" ? "rtl" : "ltr"}
                    value={secondaryName}
                    onChange={(e) => setSecondaryName(e.target.value)}
                    placeholder="e.g. Emma, Noor, Mom..."
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-black focus:border-[#d4af37] outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── High-Margin Upsell #2: Signature Luxury Velvet Gift Box ── */}
        <div
          onClick={() => setHasGiftBox(!hasGiftBox)}
          className={`rounded-2xl p-4 border transition-all cursor-pointer ${
            hasGiftBox
              ? "border-[#b8860b] bg-[#faf6ed]/50 shadow-sm"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="giftBoxCheckbox"
                checked={hasGiftBox}
                onChange={(e) => setHasGiftBox(e.target.checked)}
                className="w-4 h-4 text-[#b8860b] rounded cursor-pointer accent-[#b8860b]"
              />
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#b8860b]" />
                <span className="text-xs font-semibold text-black">
                  Add Signature Luxury Velvet Gift Box &amp; Ribbon
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#b8860b]">+A$9.95</span>
          </div>
          <p className="text-[11px] text-gray-500 pl-7 mt-1">
            Plush emerald &amp; gold debossed jewelry box, soft velvet interior cushion &amp; satin bow. Ready for giving.
          </p>
        </div>

        {/* Dynamic Delivery Timeframe Badge (Honest expectation) */}
        <div className="bg-[#faf8f4] border border-[#e8dfc8] rounded-xl p-3.5 flex items-start gap-3">
          <Clock className="w-4 h-4 text-[#b8860b] shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700">
            <span className="font-semibold text-black">
              Estimated Delivery: {deliveryWindow}
            </span>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Custom handcrafting takes 5–7 business days + direct express air shipping (2–3 weeks total). Worth every moment for a piece made just for you.
            </p>
          </div>
        </div>

        {/* Honest Australian Law & Quality Badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 bg-white border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>100% Waterproof &amp; Sweat-Proof</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>316L Surgical Stainless Steel Base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Hypoallergenic • Zero Nickel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>12-Hour Spelling Grace Period</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!nameText.trim() || (isBundle && !secondaryName.trim()) || isAdded}
          className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            !nameText.trim() || (isBundle && !secondaryName.trim())
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : isAdded
              ? "bg-emerald-600 text-white"
              : "bg-[#111] text-white hover:bg-[#b8860b] hover:text-black"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" /> Customized &amp; Added to Bag
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" /> Add Customized Necklace to Bag ({formatPrice(totalPrice)})
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center font-mono">
          Handcrafted individually for you • 100% Free Remake Guarantee for any manufacturing flaws
        </p>
      </div>
    </div>
  );
}

