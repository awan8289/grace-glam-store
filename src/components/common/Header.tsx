'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/format';
import { Product } from '@/types';
import { BRAND_CONFIG } from '@/constants/config';
import { useIsHydrated } from '@/lib/useIsHydrated';

/** Shape returned by `/api/products`, narrowed to what search needs. */
interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  variants: { images: string[] }[];
}

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isCheckout = pathname === '/checkout';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mounted = useIsHydrated();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Cart store
  const { items: cartItems, isOpen: isCartOpen, openCart, closeCart, removeItem, updateQuantity, getTotalItems, getTotalPrice, addItem } = useCartStore();
  const totalCartCount = getTotalItems();
  const totalPrice = getTotalPrice();

  // Favorite store
  const { items: favoriteItems, isOpen: isFavOpen, openFavorites, closeFavorites, removeFavorite } = useFavoriteStore();

  // Auth store
  const { user, isLoggedIn, openAuthModal, logout, requireAuth } = useAuthStore();

  const handleProceedToCheckout = () => {
    closeCart();
    requireAuth(() => {
      router.push('/checkout');
    });
  };

  // Search click-outside logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-close the drawers on route change. These are zustand setters (an
  // external store), which is exactly what an effect is for.
  useEffect(() => {
    closeCart();
    closeFavorites();
  }, [pathname, closeCart, closeFavorites]);

  // Prevent background scrolling when any drawer is open. Restoring to '' rather
  // than 'unset' leaves any page-level scroll lock (the shop filter drawer) alone.
  useEffect(() => {
    if (!isCartOpen && !isFavOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen, isFavOpen]);

  // Moving a wishlist item into the bag: fetch the real product so the cart
  // carries live pricing, stock and variants rather than a synthesised stub.
  const handleMoveToBag = async (item: typeof favoriteItems[0]) => {
    try {
      const response = await fetch(`/api/products/${item.id}`);
      if (!response.ok) throw new Error('Product unavailable');

      const { product } = (await response.json()) as { product: Product };
      addItem(
        product,
        product.sizes[0] ?? 'One Size',
        product.variants.find((variant) => variant.stock > 0)?.colorName ??
          product.variants[0]?.colorName ??
          'Default',
        1
      );
      removeFavorite(item.id);
    } catch {
      // The product is gone from the catalogue — send the shopper to the shop.
      closeFavorites();
      router.push('/shop');
    }
  };

  // Search hits the live catalogue rather than a hard-coded list, so results
  // always match what the admin panel has published.
  useEffect(() => {
    if (!isSearchOpen) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ status: 'active', sort: 'name' });
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const response = await fetch(`/api/products?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search failed');

        const body = await response.json();
        setSearchResults(
          (body.products as SearchProduct[]).slice(0, 8).map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            category: product.category,
            image: product.images[0] ?? product.variants[0]?.images[0] ?? '/products/placeholder.webp',
          }))
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isSearchOpen, searchQuery]);

  return (
    <>
      {/* ================= FREE SHIPPING BANNER (Marquee) ================= */}
      <div className="w-full bg-[#d3a95d] z-[101] relative overflow-hidden h-7 flex items-center">
        <div className="marquee-track" style={{ '--marquee-duration': '22s' } as React.CSSProperties}>
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-black text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap px-10">
              ✈️ Free Shipping Over A$150 &nbsp;•&nbsp; Australia &amp; New Zealand &nbsp;•&nbsp; Shop Now
            </span>
          ))}
        </div>
      </div>

      {/* ================= HEADER NAVBAR ================= */}
      <div className="relative w-full z-[100]" ref={searchRef}>
        <nav className="w-full h-[60px] md:h-[70px] bg-[#0a0a0a] border-b border-gray-900 flex items-center justify-between px-4 md:px-12">

          {/* Mobile: Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex md:hidden items-center justify-center w-9 h-9 text-white"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo Area */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#d3a95d] flex items-center justify-center bg-[#111] transition-transform duration-300 group-hover:scale-105">
              <span className="text-[#d3a95d] font-serif font-bold text-xs md:text-sm tracking-tighter">G&amp;G</span>
            </div>
            <span className="font-serif text-base md:text-lg tracking-[0.2em] text-[#d3a95d] font-bold group-hover:text-amber-300 transition-colors">
              {BRAND_CONFIG.name}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-[0.15em] text-white">
            <li><Link href="/" className="hover:text-[#d3a95d] cursor-pointer transition-colors">Home</Link></li>
            <li><Link href="/shop" className="hover:text-[#d3a95d] cursor-pointer transition-colors">Shop</Link></li>
            <li><Link href="/maison" className="hover:text-[#d3a95d] cursor-pointer transition-colors">The Maison</Link></li>
          </ul>

          {/* Right Section: Search & Icons */}
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* Search Input Box - Desktop only */}
            <div className="relative hidden md:block w-56 lg:w-64">
              <input
                type="text"
                placeholder="I'm looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-[#1a1a1a] border border-gray-800 text-white text-sm rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-[#d3a95d] transition-colors placeholder-gray-500"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-4 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex md:hidden items-center justify-center text-white w-8 h-8"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* ====== PREMIUM ICONS ====== */}
            <div className="flex items-center gap-3 md:gap-5 text-white">
              
              {/* 1. Account / User — auth-aware, hidden on mobile (in bottom nav) */}
              <div className="relative hidden md:block" ref={userMenuRef}>
                {mounted && isLoggedIn && user ? (
                  <>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center justify-center w-8 h-8 rounded-full text-black font-bold text-xs tracking-wide cursor-pointer transition-all hover:ring-2 hover:ring-[#d3a95d]/60 overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #d3a95d, #f0d090)" }}
                      aria-label="Account menu"
                    >
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar is an arbitrary remote URL
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.avatar
                      )}
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 top-full mt-3 w-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50"
                          style={{ background: "linear-gradient(160deg, #0d1b2a, #0f1622)" }}
                        >
                          {/* User info */}
                          <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full text-black font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-md"
                              style={{ background: "linear-gradient(135deg, #d3a95d, #f0d090)" }}
                            >
                              {user.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element -- avatar is an arbitrary remote URL
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.avatar
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                              <p className="text-gray-400 text-xs truncate mt-0.5">{user.email}</p>
                              {user.membershipTier && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-[#d3a95d]/20 text-[#d3a95d] border border-[#d3a95d]/40 rounded-full">
                                  {user.membershipTier}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Menu items */}
                          <div className="py-2">
                            <Link
                              href="/account"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-200 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-[#d3a95d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              My Account &amp; Dashboard
                            </Link>
                          </div>
                          {/* Logout */}
                          <div className="border-t border-white/10 py-2">
                            <button
                              onClick={() => { logout(); setIsUserMenuOpen(false); }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm font-medium transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  // Not logged in: show sign-in button
                  <button
                    onClick={() => openAuthModal('login')}
                    className="flex items-center gap-1.5 text-white hover:text-[#d3a95d] transition-colors"
                    aria-label="Sign In"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                    <span className="text-xs font-semibold tracking-wide hidden md:block">Sign In</span>
                  </button>
                )}
              </div>

              {/* 2. Favorites / Wishlist - hidden on mobile (in bottom nav) */}
              <button onClick={() => openFavorites()} className="hidden md:flex hover:text-[#d3a95d] transition-colors relative" aria-label="Open Wishlist">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                <span suppressHydrationWarning className="absolute -top-1.5 -right-2 bg-white text-black text-[9px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm">{mounted ? favoriteItems.length : 0}</span>
              </button>

              {/* 3. Cart / Bag */}
              <button onClick={() => openCart()} className="hover:text-[#d3a95d] transition-colors relative" aria-label="Open Cart">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                <span suppressHydrationWarning className="absolute -top-1.5 -right-2 bg-[#d3a95d] text-black text-[9px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm">{mounted ? totalCartCount : 0}</span>
              </button>

            </div>
          </div>
        </nav>

        {/* ================= SEARCH OVERLAY (White Theme) ================= */}
        <AnimatePresence>
          {isSearchOpen && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-2xl py-10 px-6 md:px-12 z-40"
              >
                <div className="max-w-[1400px] mx-auto">
                  <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                    <h3 className="text-black font-bold text-lg tracking-wide">
                      {searchQuery.trim() ? `Results for “${searchQuery.trim()}”` : 'Popular Products'}
                    </h3>
                    <button onClick={() => setIsSearchOpen(false)} className="text-gray-500 hover:text-black text-sm flex items-center gap-1">Close ✕</button>
                  </div>

                  {searchLoading && searchResults.length === 0 ? (
                    <p className="py-10 text-center text-sm text-gray-400">Searching…</p>
                  ) : searchResults.length === 0 ? (
                    <p className="py-10 text-center text-sm text-gray-400">
                      Nothing matched that search. <Link href="/shop" onClick={() => setIsSearchOpen(false)} className="text-[#d3a95d] underline">Browse the full collection</Link>.
                    </p>
                  ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {searchResults.map((prod) => (
                      <Link
                        key={`search-${prod.id}`}
                        href={`/product/${prod.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="group cursor-pointer flex flex-col"
                      >
                        <div className="relative bg-gray-50 border border-gray-100 rounded-lg h-48 mb-4 overflow-hidden">
                          <Image src={prod.image} alt={prod.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
                        </div>
                        <h4 className="text-black font-serif text-sm mb-1 truncate">{prod.name}</h4>
                        <span className="text-[#d3a95d] font-bold text-sm">{formatPrice(prod.price)}</span>
                      </Link>
                    ))}
                  </div>
                  )}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-30 pointer-events-none mt-[10vh]" />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ================= FAVORITES (WISHLIST) DRAWER ================= */}
      <AnimatePresence>
        {isFavOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => closeFavorites()}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: "0%" }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="font-serif text-2xl text-black tracking-wide">Wishlist ({favoriteItems.length})</h2>
                <button onClick={() => closeFavorites()} className="text-gray-400 hover:text-black transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {favoriteItems.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="font-serif text-lg mb-2">Your wishlist is empty</p>
                    <p className="text-xs font-light">Explore our collection to save your favorite items.</p>
                  </div>
                ) : (
                  favoriteItems.map((item) => (
                    <div key={`fav-${item.id}`} className="flex gap-4 group">
                      <div className="relative w-24 h-32 bg-gray-50 border border-gray-100 rounded-md shrink-0 overflow-hidden">
                        <Image src={item.image} alt={item.name} fill sizes="96px" className="object-contain" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-black text-sm mb-1">{item.name}</h4>
                        <p className="text-[#d3a95d] font-bold text-sm mb-3">{item.price}</p>
                        <button 
                          onClick={() => handleMoveToBag(item)}
                          className="text-xs uppercase tracking-widest text-white bg-black hover:bg-[#d3a95d] hover:text-black px-4 py-2 font-bold transition-all rounded shadow-sm text-center"
                        >
                          Move to Bag
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFavorite(item.id)}
                        className="text-gray-400 hover:text-red-500 self-start mt-2 p-1"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= SHOPPING BAG (CART) DRAWER ================= */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => closeCart()}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: "0%" }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="font-serif text-2xl text-black tracking-wide">Shopping Bag ({totalCartCount})</h2>
                <button onClick={() => closeCart()} className="text-gray-400 hover:text-black transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="font-serif text-lg mb-2">Your shopping bag is empty</p>
                    <p className="text-xs font-light mb-6">Discover our hijabs, scarves and everyday essentials.</p>
                    <Link
                      href="/shop"
                      onClick={() => closeCart()}
                      className="inline-block bg-black text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#d3a95d] hover:text-black transition-colors"
                    >
                      Explore Shop
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item, idx) => (
                    <div key={`cart-${item.product.id}-${item.selectedSize}-${item.selectedColor}-${idx}`} className="flex gap-4">
                      <div className="relative w-24 h-32 bg-gray-50 border border-gray-100 rounded-md shrink-0 overflow-hidden">
                        <Image src={item.product.images[0] || '/products/placeholder.webp'} alt={item.product.name} fill sizes="96px" className="object-contain" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-black text-sm">{item.product.name}</h4>
                        <p className="text-gray-500 text-xs mt-1">Size: {item.selectedSize}</p>
                        <div className="flex justify-between items-end mt-4">
                          <div className="flex items-center border border-gray-200 rounded">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                              className="flex h-10 w-10 items-center justify-center text-gray-500 hover:text-black"
                            >
                              -
                            </button>
                            <span className="px-2 text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                              className="flex h-10 w-10 items-center justify-center text-gray-500 hover:text-black"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-[#d3a95d] font-bold text-sm">{formatPrice(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                        className="text-gray-400 hover:text-red-500 self-start mt-2"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {/* Cart Footer / Checkout */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 uppercase tracking-widest text-xs font-bold">Subtotal</span>
                    <span className="text-xl font-serif text-black">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-6 font-light">Taxes and shipping calculated at checkout.</p>
                  <button 
                    onClick={handleProceedToCheckout}
                    className="w-full bg-black text-white font-bold py-4 uppercase tracking-[0.2em] text-sm hover:bg-[#d3a95d] hover:text-black transition-colors shadow-xl"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MOBILE SLIDE-OUT MENU ================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[200] flex">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: '0%' }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }}
              className="relative w-72 bg-[#0a0a0a] h-full shadow-2xl flex flex-col z-10 border-r border-gray-800"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                <span className="font-serif text-[#d3a95d] text-lg font-bold tracking-widest">{BRAND_CONFIG.name}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Nav Links */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/shop', label: 'Shop' },
                  { href: '/maison', label: 'The Maison' },
                  { href: '/account', label: 'My Account' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-white hover:text-[#d3a95d] hover:bg-white/5 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              {/* Bottom user info */}
              {mounted && isLoggedIn && user && (
                <div className="px-6 py-4 border-t border-gray-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-xs" style={{ background: 'linear-gradient(135deg,#d3a95d,#f0d090)' }}>
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar is an arbitrary remote URL
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        user.avatar
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{user.name}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full text-left text-red-400 text-xs font-semibold uppercase tracking-wider px-2 py-2 hover:bg-red-500/10 rounded-lg transition-colors">
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= BOTTOM MOBILE NAVIGATION BAR ================= */}
      {/*
        Hidden during checkout. It is `fixed bottom-0 z-[150]`, so on a phone it
        sits directly on top of the "Place Order" button whenever that button
        scrolls to the bottom of the viewport — and Home/Shop/Wishlist are not
        links anyone should be offered halfway through paying.
      */}
      {!isCheckout && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-[#0a0a0a] border-t border-gray-800 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Home */}
          <Link href="/" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400 hover:text-[#d3a95d] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">Home</span>
          </Link>
          {/* Account */}
          <Link href="/account" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400 hover:text-[#d3a95d] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">Account</span>
          </Link>
          {/* Shop */}
          <Link href="/shop" className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400 hover:text-[#d3a95d] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-wide">Shop</span>
          </Link>
          {/* Wishlist */}
          <button onClick={() => openFavorites()} className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400 hover:text-[#d3a95d] transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
            {mounted && favoriteItems.length > 0 && <span suppressHydrationWarning className="absolute top-0 right-2 bg-[#d3a95d] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{favoriteItems.length}</span>}
            <span className="text-[9px] font-bold uppercase tracking-wide">Wishlist</span>
          </button>
          {/* Cart */}
          <button onClick={() => openCart()} className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400 hover:text-[#d3a95d] transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" /></svg>
            {mounted && totalCartCount > 0 && <span suppressHydrationWarning className="absolute top-0 right-2 bg-[#d3a95d] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{totalCartCount}</span>}
            <span className="text-[9px] font-bold uppercase tracking-wide">Cart</span>
          </button>
        </div>
      </div>
      )}
    </>
  );
}
