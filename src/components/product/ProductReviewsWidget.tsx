'use client';

import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, ShieldCheck } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  location: string;
  verified: boolean;
  rating: number;
  date: string;
  title: string;
  body: string;
  productType: string;
  helpfulCount: number;
}

const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'Jessica M.',
    location: 'Sydney, NSW',
    verified: true,
    rating: 5,
    date: '3 days ago',
    title: 'Stunning Arabic calligraphy! Waterproof test passed completely.',
    body: "I ordered my daughter's name in Arabic script with the 18K Gold-Plated finish and standard 45cm chain. The luster is genuine luxury gold, no brassy yellow hue. She wears it daily even in the ocean and shower, and there is zero tarnishing or green skin! The velvet gift box made it feel like a high-end designer piece.",
    productType: '18K Gold-Plated / Arabic Script / 45 cm',
    helpfulCount: 28,
  },
  {
    id: 'rev-2',
    name: 'Liam & Chloe H.',
    location: 'Melbourne, VIC',
    verified: true,
    rating: 5,
    date: '1 week ago',
    title: 'Two-Name bundle was the best decision — incredible value.',
    body: 'Took advantage of the two-name bundle offer to get matching necklaces for my wife and our newborn daughter. The 20% discount on the second necklace was a fantastic bonus. Arrived in Melbourne in 16 days carefully packaged in the signature velvet boxes. The craftsmanship and laser-cut edges are smooth and elegant.',
    productType: 'Two-Name Matching Bundle / 18K Gold-Plated',
    helpfulCount: 19,
  },
  {
    id: 'rev-3',
    name: 'Amira S.',
    location: 'Brisbane, QLD',
    verified: true,
    rating: 5,
    date: '2 weeks ago',
    title: 'Flawless Arabic spelling & lettering — so impressed.',
    body: 'A lot of custom shops butcher Arabic cursive connections, but Grace & Glam got the diacritics and ligatures 100% correct. Knowing they have an Australian customer service team on WhatsApp gave me so much peace of mind before placing the order.',
    productType: '18K Gold-Plated / Arabic Script',
    helpfulCount: 14,
  },
  {
    id: 'rev-4',
    name: 'Brooke K.',
    location: 'Perth, WA',
    verified: true,
    rating: 5,
    date: '3 weeks ago',
    title: 'Worth every day of the crafting time.',
    body: "Delivery to Perth took 17 days, but because it's custom laser-cut and hand-polished for you, I was happy to wait. The 316L stainless steel base makes it feel substantial and durable without being heavy. No scratches after a month of non-stop wear.",
    productType: 'Sterling Silver Finish / English Script / 40 cm',
    helpfulCount: 11,
  },
  {
    id: 'rev-5',
    name: 'Georgia T.',
    location: 'Adelaide, SA',
    verified: true,
    rating: 5,
    date: '1 month ago',
    title: 'The velvet gift box is an absolute must-have.',
    body: "Added the A$9.95 luxury gift box and I'm so glad I did. The emerald and gold presentation made it ready for gifting straight out of the delivery box. My sister actually cried when she opened it on her 21st birthday.",
    productType: '18K Rose Gold / Luxury Gift Box',
    helpfulCount: 8,
  },
];

export default function ProductReviewsWidget({ productName }: { productName: string }) {
  const [activeFilter, setActiveFilter] = useState<'all' | '5star'>('all');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

  const handleVoteHelpful = (id: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  };

  const filteredReviews = REVIEWS.filter((rev) => {
    if (activeFilter === '5star') return rev.rating === 5;
    return true;
  });

  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-16 border-t border-gray-200 bg-white">
      {/* Judge.me Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-8 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Judge.me Reviews
            </span>
            <span className="text-xs text-gray-500 font-mono">Australia &amp; NZ</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-black">
            Customer Reviews &amp; Photos
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Honest feedback from verified Australian commissions
          </p>
        </div>

        {/* Big Score Summary */}
        <div className="flex items-center gap-6 bg-[#faf8f4] border border-[#e8e4dc] rounded-2xl p-5">
          <div className="text-center pr-6 border-r border-[#e8e4dc]">
            <span className="text-4xl font-serif font-bold text-black block">4.9</span>
            <div className="flex items-center justify-center gap-0.5 text-amber-500 my-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <span className="text-[11px] text-gray-500 font-mono">128 Verified Reviews</span>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-1 text-xs text-gray-600 w-44">
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono text-[10px]">5 ★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full w-[94%] rounded-full" />
              </div>
              <span className="text-[10px] font-mono w-7 text-right">94%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono text-[10px]">4 ★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full w-[6%] rounded-full" />
              </div>
              <span className="text-[10px] font-mono w-7 text-right">6%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono text-[10px]">3 ★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gray-300 h-full w-[0%] rounded-full" />
              </div>
              <span className="text-[10px] font-mono w-7 text-right">0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-black text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Reviews (128)
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('5star')}
          className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
            activeFilter === '5star'
              ? 'bg-black text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          5-Star Ratings (120)
        </button>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="py-8 flex flex-col md:flex-row gap-6">
            {/* Author info */}
            <div className="w-full md:w-56 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-black text-sm">{rev.name}</span>
                {rev.verified && (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{rev.location}</p>
              <p className="text-[11px] text-gray-400 font-mono mt-2">{rev.date}</p>
              <div className="mt-3 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700 block mb-0.5">Purchased item:</span>
                {rev.productType}
              </div>
            </div>

            {/* Review content */}
            <div className="flex-1">
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                ))}
              </div>

              <h4 className="font-serif font-bold text-base text-black mb-2">
                {rev.title}
              </h4>

              <p className="text-gray-600 text-sm leading-relaxed font-light mb-4">
                {rev.body}
              </p>

              {/* Helpfulness footer */}
              <div className="flex items-center gap-4 pt-2 text-xs text-gray-400">
                <span>Was this review helpful?</span>
                <button
                  type="button"
                  onClick={() => handleVoteHelpful(rev.id)}
                  className="flex items-center gap-1 hover:text-black transition-colors cursor-pointer border border-gray-200 rounded-md px-2.5 py-1 text-gray-600 hover:border-gray-400"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Yes ({rev.helpfulCount + (helpfulVotes[rev.id] ?? 0)})</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
