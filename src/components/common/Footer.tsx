'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // The footer sits below the fold on every page, so fetching after paint costs
  // the shopper nothing and keeps the collection links honest as the admin edits.
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    fetch('/api/categories')
      .then((response) => (response.ok ? response.json() : { categories: [] }))
      .then((data) => {
        if (live) setCategories(data.categories ?? []);
      })
      .catch(() => {
        // A footer link list is not worth surfacing an error for.
      });
    return () => {
      live = false;
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-[#0a0a0a] text-gray-400 font-sans border-t border-neutral-800/60 pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* ================= SECTION 1: TOP 4 COLUMNS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 pb-16">
          
          {/* COLUMN 1: CLIENT SERVICES */}
          <div className="flex flex-col space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-2xl tracking-[0.18em] text-[#d3a95d] font-bold">
                GRACE &amp; GLAM
              </h3>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500 font-medium">
                Client Services
              </p>
            </div>

            <p className="text-sm text-gray-300 font-light leading-relaxed">
              Questions about a fabric, a length, or an order already on its way? Email us and a person will answer.
            </p>

            <div className="space-y-3 text-sm text-gray-300 font-light">
              <div className="flex items-center gap-3 group">
                <Mail className="w-4 h-4 text-[#d3a95d] shrink-0" />
                <a href="mailto:sales@graceglam.com.au" className="hover:text-[#d3a95d] transition-colors">
                  sales@graceglam.com.au
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <svg className="w-4 h-4 text-[#25D366] shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <a
                  href="https://wa.me/61494794408"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25D366] transition-colors"
                >
                  WhatsApp: +61 494 794 408
                </a>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-widest text-gray-400 font-medium block mb-3">
                Follow The Maison
              </span>
              <div className="flex items-center space-x-3">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/graceandglam.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full border border-neutral-700/80 flex items-center justify-center text-gray-300 hover:text-black hover:bg-[#d3a95d] hover:border-[#d3a95d] transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/graceandglam.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full border border-neutral-700/80 flex items-center justify-center text-gray-300 hover:text-black hover:bg-[#d3a95d] hover:border-[#d3a95d] transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* WhatsApp Chat Direct */}
                <a
                  href="https://wa.me/61494794408"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full border border-neutral-700/80 flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#25D366] hover:border-[#25D366] transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* COLUMN 2: THE MAISON / COMPANY */}
          <div className="flex flex-col space-y-5">
            <h4 className="font-serif text-lg text-white tracking-wider uppercase font-medium border-b border-neutral-800 pb-3 inline-block">
              The Maison
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/atelier" className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5">
                  Fabric &amp; Craft
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5">
                  Refund &amp; Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: COLLECTIONS / CATEGORIES */}
          <div className="flex flex-col space-y-5">
            <h4 className="font-serif text-lg text-white tracking-wider uppercase font-medium border-b border-neutral-800 pb-3 inline-block">
              Collections
            </h4>
            <ul className="space-y-3 text-sm">
              {/*
                Live from the catalogue, not a hand-written list. The old hard-coded
                four had already fallen behind — "Accessories" existed in the admin
                picker and was nowhere down here.
              */}
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(category)}`}
                    className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5"
                  >
                    {category}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop?tag=new-arrivals" className="text-gray-400 hover:text-[#d3a95d] transition-colors duration-200 block py-0.5">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: EXCLUSIVE NEWSLETTER */}
          <div className="flex flex-col space-y-5">
            <h4 className="font-serif text-lg text-white tracking-wider uppercase font-medium border-b border-neutral-800 pb-3 inline-block">
              Join The Inner Circle
            </h4>
            <p className="text-sm text-gray-300 font-light leading-relaxed">
              Subscribe to receive private invitations to new capsule drops, bespoke trunk shows, and editorial previews.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-4 pt-1">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-transparent text-white text-base py-3 px-1 border-b border-[#d3a95d]/60 placeholder-gray-500 focus:outline-none focus:border-[#d3a95d] transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#d3a95d] text-black font-medium tracking-[0.2em] text-xs uppercase py-3.5 px-6 rounded-none hover:bg-[#c2984c] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-[#d3a95d]/10"
              >
                <span>Subscribe</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              {subscribed && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Welcome to the Grace &amp; Glam inner circle.</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* ================= SECTION 2: BOTTOM COPYRIGHT BAR ================= */}
        <div className="border-t border-neutral-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-gray-500 font-light">
          
          {/* Left Side */}
          <div>
            <p>&copy; 2026 Grace &amp; Glam. All Rights Reserved.</p>
          </div>

          {/* Right Side: Secure Payments & Icons */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 hidden md:inline">
              Secure Payments
            </span>

            <div className="flex items-center space-x-2 text-gray-400">
              {/* VISA */}
              <div className="h-6 px-2.5 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center font-bold text-[10px] text-white tracking-widest">
                VISA
              </div>

              {/* MASTERCARD */}
              <div className="h-6 px-2.5 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center font-bold text-[10px] text-white tracking-wider">
                MC
              </div>

              {/* AMEX */}
              <div className="h-6 px-2.5 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center font-bold text-[10px] text-[#0077C5] tracking-wider">
                AMEX
              </div>

              {/* APPLE PAY */}
              <div className="h-6 px-2.5 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center font-semibold text-[10px] text-white tracking-wider">
                Apple Pay
              </div>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
