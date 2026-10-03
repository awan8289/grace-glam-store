'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuthStore, Order, SavedCard } from '@/store/useAuthStore';
import { useIsHydrated } from '@/lib/useIsHydrated';

// Preset avatar options for quick selection
const PRESET_AVATARS = [
  { id: 'preset-1', name: 'Royale Gold Crest', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { id: 'preset-2', name: 'Emerald Couture', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { id: 'preset-3', name: 'Midnight Atelier', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { id: 'preset-4', name: 'Silk Sophistique', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { id: 'preset-5', name: 'Sapphire VIP', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { id: 'preset-6', name: 'Diamond Noir', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
];

export default function AccountPage() {
  const {
    user,
    orders,
    isLoggedIn,
    isReady,
    openAuthModal,
    loginWithGoogle,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    addSavedCard,
    deleteSavedCard,
    setDefaultCard,
  } = useAuthStore();

  const mounted = useIsHydrated();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'cards'>('profile');
  // `undefined` = untouched, so the newest order shows by default; `null` is a
  // deliberate deselection.
  const [orderChoice, setOrderChoice] = useState<Order | null | undefined>(undefined);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Add Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrCountry, setNewAddrCountry] = useState('Australia');
  const [newAddrZip, setNewAddrZip] = useState('');
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);

  // Add Card Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardNum, setNewCardNum] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardBrand, setNewCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex' | 'ApplePay'>('Visa');
  const [newCardIsDefault, setNewCardIsDefault] = useState(false);

  // Google sign-in never shares a phone number, so new Google accounts start
  // without one. Ask for it once, up front, instead of guessing.
  const [quickPhone, setQuickPhone] = useState('');
  const [quickPhoneError, setQuickPhoneError] = useState('');
  const [savingQuickPhone, setSavingQuickPhone] = useState(false);

  const handleQuickPhoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = quickPhone.replace(/[^\d+]/g, '');
    if (!/^(\+?61|0)4\d{8}$/.test(digits) && !/^\+?\d{9,15}$/.test(digits)) {
      setQuickPhoneError('Please enter a valid mobile number, e.g. 0412 345 678.');
      return;
    }
    setQuickPhoneError('');
    setSavingQuickPhone(true);
    await updateProfile({ phone: quickPhone.trim() });
    setSavingQuickPhone(false);
    setProfileSuccessMsg('Mobile number saved.');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  /** Opens the profile form pre-filled from the current user. */
  const startEditingProfile = () => {
    setEditName(user?.name ?? '');
    setEditPhone(user?.phone ?? '');
    setEditEmail(user?.email ?? '');
    setIsEditingProfile(true);
  };

  // Handle copy tracking number
  const handleCopyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedTracking(num);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  // Handle profile save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
    });
    setIsEditingProfile(false);
    setProfileSuccessMsg('Profile updated successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  // Handle avatar update
  const handleSelectAvatar = (url: string) => {
    updateProfile({ avatarUrl: url });
    setIsAvatarModalOpen(false);
    setProfileSuccessMsg('Profile photo updated!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  // Handle add address submit
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrName || !newAddrStreet || !newAddrCity) return;
    addAddress({
      label: newAddrLabel || 'Address',
      fullName: newAddrName,
      phone: newAddrPhone,
      street: newAddrStreet,
      city: newAddrCity,
      state: newAddrState,
      country: newAddrCountry,
      zipCode: newAddrZip,
      isDefault: newAddrIsDefault,
    });
    setIsAddressModalOpen(false);
    // Reset form
    setNewAddrName('');
    setNewAddrPhone('');
    setNewAddrStreet('');
    setNewAddrCity('');
    setNewAddrState('');
    setNewAddrZip('');
  };

  // Handle add card submit
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName || !newCardNum || !newCardExpiry) return;
    const masked = `•••• •••• •••• ${newCardNum.slice(-4) || '4242'}`;
    addSavedCard({
      cardholderName: newCardName.toUpperCase(),
      cardNumberMasked: masked,
      expiryDate: newCardExpiry,
      brand: newCardBrand,
      isDefault: newCardIsDefault,
    });
    setIsCardModalOpen(false);
    // Reset form
    setNewCardName('');
    setNewCardNum('');
    setNewCardExpiry('');
  };

  // Loading state while checking session
  if (!mounted || !isReady) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden bg-[#faf8f4]">
        <div className="w-12 h-12 rounded-full border-2 border-[#d3a95d]/30 border-t-[#d3a95d] animate-spin mb-4" />
        <p className="text-gray-500 text-xs font-mono uppercase tracking-[0.2em]">Loading Maison Account...</p>
      </div>
    );
  }

  // If not logged in guard view
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden bg-[#faf8f4]">
        {/* Background glow */}
        <div className="absolute w-[500px] h-[500px] bg-[#d3a95d]/10 rounded-full blur-[140px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md w-full bg-white border border-[#d3a95d]/30 rounded-3xl p-8 shadow-lg space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-[#d3a95d]/15 border border-[#d3a95d]/40 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#a8782a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-gray-900 tracking-wide mb-2">Maison Account Access</h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Please sign in to access your personal dashboard, saved delivery addresses and order tracking.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full bg-gradient-to-r from-[#d3a95d] to-[#f0d090] text-black font-bold py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#d3a95d]/20 hover:brightness-110 transition-all cursor-pointer"
            >
              Sign In / Register
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/api/account/google';
              }}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-xl text-gray-700 text-xs font-semibold uppercase tracking-wider hover:border-[#d3a95d]/60 hover:bg-gray-50 active:bg-white/10 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeOrdersCount = orders.filter((order) => order.status !== 'Delivered' && order.status !== 'Cancelled').length;
  const selectedOrder = orderChoice === undefined ? (orders[0] ?? null) : orderChoice;

  return (
    <div className="min-h-dvh bg-[#faf8f4] text-gray-900 pt-6 pb-24 px-4 sm:px-6 lg:px-12 relative">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#d3a95d]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ================= 1. DASHBOARD HERO HEADER ================= */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-gray-200 p-6 md:p-10 bg-gradient-to-r from-white via-white to-[#fbf6ea] shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            
            {/* Left: User Avatar & Welcome Text */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#d3a95d] p-1 bg-gray-100 flex items-center justify-center text-black font-serif font-bold text-2xl cursor-pointer overflow-hidden shadow-xl transition-transform group-hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #d3a95d, #f0d090)" }}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar is an arbitrary remote URL
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.avatar
                  )}
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 bg-[#d3a95d] text-black p-1.5 rounded-full border border-black shadow-md hover:bg-white transition-colors"
                  title="Change Photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h0.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-serif text-2xl md:text-4xl text-gray-900 tracking-wide font-medium">
                    {user.name}
                  </h1>
                  {/* Only shown when a real tier exists — no default badge. */}
                  {user.membershipTier && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#d3a95d]/20 text-[#a8782a] border border-[#d3a95d]/50 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d3a95d] animate-pulse" />
                      {user.membershipTier}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs md:text-sm font-light">
                  {user.email} • Member since {new Date(user.createdAt).getFullYear()}
                </p>
                {profileSuccessMsg && (
                  <p className="text-emerald-700 text-xs font-semibold animate-bounce mt-1">
                    ✓ {profileSuccessMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Key Account Metric Badges */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="bg-white border border-gray-200 backdrop-blur-md rounded-2xl p-3.5 text-center min-w-[110px]">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Active Orders</p>
                <p className="text-gray-900 font-serif text-xl font-bold mt-1 text-[#a8782a]">
                  {activeOrdersCount} {activeOrdersCount > 0 ? 'In Transit' : 'None'}
                </p>
              </div>
              {/* Points only appear once a real rewards balance exists. The
                  "Saved Cards" tile was removed: cards are never stored here —
                  Stripe handles payment. */}
              {typeof user.rewardPoints === 'number' && user.rewardPoints > 0 && (
                <div className="bg-white border border-gray-200 backdrop-blur-md rounded-2xl p-3.5 text-center min-w-[110px]">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Reward Points</p>
                  <p className="text-gray-900 font-serif text-xl font-bold mt-1 text-[#a8782a]">
                    {user.rewardPoints} <span className="text-xs font-sans text-gray-600 font-normal">pts</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ================= ADD PHONE PROMPT (e.g. after Google sign-in) ================= */}
        {!user.phone && (
          <form
            onSubmit={handleQuickPhoneSave}
            className="rounded-2xl border border-[#d3a95d]/40 bg-[#fbf6ea] p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="flex-1">
              <p className="font-serif text-lg text-gray-900">Add your mobile number</p>
              <p className="text-sm text-gray-600 mt-1">
                We only use it to contact you about your order and delivery.
              </p>
              {quickPhoneError && <p className="text-sm text-red-600 mt-2">{quickPhoneError}</p>}
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="04XX XXX XXX"
                aria-label="Mobile number"
                className="flex-1 md:w-56 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:border-[#b8860b]"
              />
              <button
                type="submit"
                disabled={savingQuickPhone || !quickPhone.trim()}
                className="rounded-xl bg-[#d3a95d] px-5 py-3 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
              >
                {savingQuickPhone ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* ================= 2. DASHBOARD TAB NAVIGATION ================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#d3a95d] text-black shadow-lg shadow-[#d3a95d]/20'
                : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#d3a95d] text-black shadow-lg shadow-[#d3a95d]/20'
                : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Orders &amp; Tracking
            {activeOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-[#d3a95d] text-black shadow-lg shadow-[#d3a95d]/20'
                : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Address Book
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-[#d3a95d] text-black shadow-lg shadow-[#d3a95d]/20'
                : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Saved Cards
          </button>


        </div>

        {/* ================= 3. TAB CONTENT SECTIONS ================= */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: MY PROFILE & PERSONAL INFO */}
          {activeTab === 'profile' && (
            <motion.div
              key="tab-profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Profile Card & Details */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="font-serif text-xl text-gray-900 font-medium">Personal Information</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Manage your contact details and luxury profile credentials</p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={startEditingProfile}
                      className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase border border-[#d3a95d] text-[#a8782a] hover:bg-[#d3a95d] hover:text-black transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d3a95d]"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d3a95d]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d3a95d]"
                          placeholder="04XX XXX XXX"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-[#d3a95d] text-black font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="bg-gray-100 text-gray-600 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Full Name</p>
                      <p className="text-gray-900 font-medium text-base mt-1">{user.name}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-200">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Email Address</p>
                      <p className="text-gray-900 font-medium text-base mt-1 truncate">{user.email}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-200">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Phone Number</p>
                      {user.phone ? (
                        <p className="text-gray-900 font-medium text-base mt-1">{user.phone}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={startEditingProfile}
                          className="mt-1 text-sm font-semibold text-[#a8782a] underline underline-offset-4"
                        >
                          + Add your mobile number
                        </button>
                      )}
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-200">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Preferred Region</p>
                      <p className="text-gray-900 font-medium text-base mt-1">🇦🇺 Australia</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar Controls */}
              <div className="space-y-6">
                {/* Photo Change Card */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 text-center space-y-4">
                  <h4 className="font-serif text-lg text-gray-900 font-medium">Customer Profile Picture</h4>
                  <div className="relative inline-block mx-auto">
                    <div className="w-24 h-24 rounded-full border-2 border-[#d3a95d] p-1 bg-gray-100 mx-auto overflow-hidden flex items-center justify-center text-black font-serif font-bold text-3xl">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar is an arbitrary remote URL
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        user.avatar
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Customize your luxury avatar photo across the Maison platform.</p>
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="w-full py-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-900 transition-colors"
                  >
                    Select / Upload Photo
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: ORDERS & REAL-TIME SHIPMENT TRACKER */}
          {activeTab === 'orders' && (
            <motion.div
              key="tab-orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Active Orders Banner */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8">
                <h3 className="font-serif text-2xl text-gray-900 font-medium mb-1">Orders &amp; Live Shipment Tracker</h3>
                <p className="text-gray-500 text-xs">Track real-time courier dispatches, packaging progress, customs status, and estimated arrivals worldwide.</p>

                {/* Orders List / Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => setOrderChoice(ord)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        selectedOrder?.id === ord.id
                          ? 'bg-white border-[#d3a95d] shadow-lg shadow-[#d3a95d]/10'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs text-gray-500 font-mono">Order #{ord.id}</span>
                          <h4 className="font-serif text-lg text-gray-900 font-semibold mt-0.5">{ord.items[0]?.name}</h4>
                          <p className="text-gray-500 text-xs mt-0.5">{ord.date} • {ord.total}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'In Transit'
                            ? 'bg-amber-500/20 text-amber-700 border border-amber-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/40'
                        }`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-xs">
                        <span className="text-gray-500">Destination: <strong className="text-gray-900 font-medium">{ord.destinationCountry}</strong></span>
                        <span className="text-[#a8782a] font-semibold hover:underline flex items-center gap-1">
                          View Live Tracking →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Order Detailed Shipment Tracking Screen */}
              {selectedOrder && (
                <div className="bg-white border border-[#d3a95d]/30 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
                  
                  {/* Order Overview Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-serif text-2xl text-gray-900 font-bold">Order #{selectedOrder.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          selectedOrder.status === 'In Transit' ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'
                        }`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        Carrier: <strong className="text-gray-900">{selectedOrder.carrier}</strong> • Payment: <strong className="text-gray-900">{selectedOrder.paymentMethod}</strong>
                      </p>
                    </div>

                    {/* Tracking Number Copy Action */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-4">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Tracking Number</p>
                        <p className="text-gray-900 font-mono text-xs font-bold mt-0.5">{selectedOrder.trackingNumber}</p>
                      </div>
                      <button
                        onClick={() => handleCopyTracking(selectedOrder.trackingNumber)}
                        className="px-3 py-1.5 bg-[#d3a95d] hover:bg-amber-300 text-black rounded-lg text-xs font-bold transition-colors"
                      >
                        {copiedTracking === selectedOrder.trackingNumber ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Live Status Highlight Banner */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-[#d3a95d]/15 to-amber-500/10 border border-[#d3a95d]/40 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#d3a95d] text-black flex items-center justify-center font-bold shrink-0 shadow-lg">
                      ✈️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#a8782a] text-xs font-bold uppercase tracking-wider">Live Courier Update</p>
                      <p className="text-gray-900 text-sm font-medium mt-0.5">
                        {selectedOrder.status === 'In Transit'
                          ? `Package status: In Transit via ${selectedOrder.carrier} to ${selectedOrder.destinationCountry}. Estimated Delivery: ${selectedOrder.estimatedDelivery}.`
                          : `Package has been successfully delivered to ${selectedOrder.shippingAddress}.`}
                      </p>
                    </div>
                  </div>

                  {/* Shipment Multi-step Visual Tracker Timeline */}
                  <div className="space-y-6">
                    <h4 className="font-serif text-xl text-gray-900 font-semibold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#a8782a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Real-Time Tracking History
                    </h4>

                    <div className="relative pl-6 sm:pl-8 border-l-2 border-gray-200 space-y-8 my-4">
                      {selectedOrder.trackingSteps.map((step, idx) => (
                        <div key={idx} className="relative group">
                          {/* Timeline Status Icon Dot */}
                          <div className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-transform ${
                            step.status === 'completed'
                              ? 'bg-[#d3a95d] text-black ring-4 ring-[#d3a95d]/20'
                              : step.status === 'current'
                              ? 'bg-amber-400 text-black ring-4 ring-amber-400/40 animate-pulse scale-110'
                              : 'bg-gray-100 text-gray-500 border border-gray-300'
                          }`}>
                            {step.status === 'completed' ? '✓' : step.status === 'current' ? '●' : idx + 1}
                          </div>

                          <div className={`p-4 rounded-2xl border ${
                            step.status === 'current'
                              ? 'bg-[#15233b] border-[#d3a95d]'
                              : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                              <h5 className={`font-semibold text-sm ${step.status === 'pending' ? 'text-gray-500' : 'text-gray-900'}`}>
                                {step.title}
                              </h5>
                              <span className="text-gray-500 text-xs font-mono">{step.timestamp}</span>
                            </div>
                            <p className="text-gray-600 text-xs leading-relaxed">{step.description}</p>
                            <p className="text-[#a8782a] text-[11px] font-semibold mt-2 flex items-center gap-1">
                              📍 Location: {step.location}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Items Breakdown */}
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <h4 className="font-serif text-lg text-gray-900 font-semibold">Items in this Package</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={`${item.productId}-${item.variantId ?? 'base'}-${item.size}-${index}`}
                          className="flex items-center justify-between bg-white border border-gray-200 p-3 sm:p-4 rounded-2xl"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 bg-black/40 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                              <Image src={item.image} alt={item.name} fill sizes="64px" className="object-contain p-1" />
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium text-sm">{item.name}</p>
                              <p className="text-gray-500 text-xs mt-0.5">Size: {item.size} • Color: {item.color}</p>
                              <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="text-[#a8782a] font-bold text-sm">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: ADDRESS BOOK */}
          {activeTab === 'addresses' && (
            <motion.div
              key="tab-addresses"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8">
                <div>
                  <h3 className="font-serif text-2xl text-gray-900 font-medium">Saved Shipping Addresses</h3>
                  <p className="text-gray-500 text-xs mt-1">Manage destination delivery locations for rapid luxury checkout worldwide.</p>
                </div>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="bg-[#d3a95d] text-black font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors shadow-lg shadow-[#d3a95d]/10 cursor-pointer"
                >
                  + Add New Address
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(user.addresses || []).map((addr) => (
                  <div
                    key={addr.id}
                    className={`relative bg-white border rounded-3xl p-6 flex flex-col justify-between space-y-4 ${
                      addr.isDefault ? 'border-[#d3a95d] bg-gradient-to-br from-[#121c2e] to-white' : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#a8782a] font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                          🏷️ {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="bg-[#d3a95d] text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            Default Address
                          </span>
                        )}
                      </div>
                      <h4 className="text-gray-900 font-semibold text-lg">{addr.fullName}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {addr.street}<br />
                        {addr.city}, {addr.state} {addr.zipCode}<br />
                        <strong className="text-gray-900 font-medium">{addr.country}</strong>
                      </p>
                      <p className="text-gray-500 text-xs font-mono">📞 {addr.phone}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs">
                      {!addr.isDefault ? (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-[#a8782a] font-bold hover:underline"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-gray-500 font-medium">Primary Location</span>
                      )}
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: STORED PAYMENT CARDS */}
          {activeTab === 'cards' && (
            <motion.div
              key="tab-cards"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8">
                <div>
                  <h3 className="font-serif text-2xl text-gray-900 font-medium">Saved Payment Cards</h3>
                  <p className="text-gray-500 text-xs mt-1">Manage encrypted payment methods for seamless 1-click ordering.</p>
                </div>
                <button
                  onClick={() => setIsCardModalOpen(true)}
                  className="bg-[#d3a95d] text-black font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors shadow-lg shadow-[#d3a95d]/10 cursor-pointer"
                >
                  + Add Payment Card
                </button>
              </div>

              {/* Cards Render Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(user.savedCards || []).map((card) => (
                  <div
                    key={card.id}
                    className="relative rounded-3xl p-6 border border-gray-200 overflow-hidden shadow-2xl flex flex-col justify-between min-h-[200px]"
                    style={{
                      background: card.isDefault
                        ? "linear-gradient(135deg, #142036 0%, #0d1624 50%, #1f2e4a 100%)"
                        : "linear-gradient(135deg, #12141c 0%, #1a1e2b 100%)",
                    }}
                  >
                    {/* Metallic Chip Accent */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-gradient-to-r from-amber-200 via-[#d3a95d] to-amber-400 rounded-md border border-amber-300/40 shadow-inner flex items-center justify-center text-[9px] font-bold text-black">
                          CHIP
                        </div>
                        <span className="text-gray-900 font-bold tracking-widest text-xs uppercase">{card.brand}</span>
                      </div>
                      {card.isDefault && (
                        <span className="bg-[#d3a95d] text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Masked Card Number */}
                    <div className="my-4">
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider">Card Number</p>
                      <p className="text-gray-900 font-mono text-xl tracking-[0.25em] font-bold mt-1">
                        {card.cardNumberMasked}
                      </p>
                    </div>

                    {/* Footer Card Info */}
                    <div className="flex justify-between items-end border-t border-gray-200 pt-3">
                      <div>
                        <p className="text-gray-500 text-[9px] uppercase tracking-wider">Cardholder</p>
                        <p className="text-gray-900 font-semibold text-xs tracking-wider uppercase mt-0.5">{card.cardholderName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[9px] uppercase tracking-wider">Expires</p>
                        <p className="text-gray-900 font-mono font-semibold text-xs mt-0.5">{card.expiryDate}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {!card.isDefault && (
                          <button
                            onClick={() => setDefaultCard(card.id)}
                            className="text-[#a8782a] font-bold hover:underline"
                          >
                            Default
                          </button>
                        )}
                        <button
                          onClick={() => deleteSavedCard(card.id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}



        </AnimatePresence>
      </div>

      {/* ================= MODAL 1: AVATAR / PHOTO SELECTION ================= */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-[#d3a95d]/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h3 className="font-serif text-xl text-gray-900 font-bold">Choose Profile Picture</h3>
                <button onClick={() => setIsAvatarModalOpen(false)} className="text-gray-500 hover:text-gray-900">✕</button>
              </div>

              {/* Custom Image URL Input */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Paste Custom Photo URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                  />
                  <button
                    onClick={() => customAvatarUrl && handleSelectAvatar(customAvatarUrl)}
                    className="bg-[#d3a95d] text-black font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-amber-300"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Curated Presets Grid */}
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Or Pick a Luxury Atelier Preset</p>
                <div className="grid grid-cols-3 gap-4">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectAvatar(avatar.url)}
                      className="group relative rounded-2xl overflow-hidden border border-gray-200 hover:border-[#d3a95d] aspect-square transition-all cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- preset avatars are remote URLs */}
                      <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[10px] text-gray-900 font-medium leading-tight truncate">{avatar.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: ADD NEW ADDRESS ================= */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-[#d3a95d]/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h3 className="font-serif text-xl text-gray-900 font-bold">Add Shipping Address</h3>
                <button onClick={() => setIsAddressModalOpen(false)} className="text-gray-500 hover:text-gray-900">✕</button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Label</label>
                    <input
                      type="text"
                      value={newAddrLabel}
                      onChange={(e) => setNewAddrLabel(e.target.value)}
                      placeholder="e.g. Home / Villa"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={newAddrName}
                      onChange={(e) => setNewAddrName(e.target.value)}
                      placeholder="Full Name"
                      autoComplete="name"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newAddrPhone}
                    onChange={(e) => setNewAddrPhone(e.target.value)}
                    placeholder="04XX XXX XXX"
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    placeholder="Suite, House No, Street name"
                    autoComplete="street-address"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={newAddrCity}
                      onChange={(e) => setNewAddrCity(e.target.value)}
                      placeholder="Sydney / Melbourne"
                      autoComplete="address-level2"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">State / Province</label>
                    <input
                      type="text"
                      value={newAddrState}
                      onChange={(e) => setNewAddrState(e.target.value)}
                      placeholder="NSW / VIC"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Country</label>
                    <select
                      value={newAddrCountry}
                      onChange={(e) => setNewAddrCountry(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                    >
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">ZIP / Postcode</label>
                    <input
                      type="text"
                      value={newAddrZip}
                      onChange={(e) => setNewAddrZip(e.target.value)}
                      placeholder="2000"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={newAddrIsDefault}
                    onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                    className="accent-[#d3a95d] w-4 h-4"
                  />
                  <span className="text-xs text-gray-600">Set as primary default address</span>
                </label>

                <button
                  type="submit"
                  className="w-full bg-[#d3a95d] text-black font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors shadow-lg mt-4 cursor-pointer"
                >
                  Save Address
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 3: ADD NEW PAYMENT CARD ================= */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCardModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-[#d3a95d]/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h3 className="font-serif text-xl text-gray-900 font-bold">Add Payment Card</h3>
                <button onClick={() => setIsCardModalOpen(false)} className="text-gray-500 hover:text-gray-900">✕</button>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder="Name as printed on card"
                    autoComplete="cc-name"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d] uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Card Number</label>
                  <input
                    type="text"
                    value={newCardNum}
                    onChange={(e) => setNewCardNum(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="4532 1234 5678 9012"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="w-full bg-white border border-gray-300 text-gray-900 font-mono text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={newCardExpiry}
                      onChange={(e) => setNewCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      className="w-full bg-white border border-gray-300 text-gray-900 font-mono text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Card Network</label>
                    <select
                      value={newCardBrand}
                      onChange={(e) => setNewCardBrand(e.target.value as SavedCard['brand'])}
                      className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#d3a95d]"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Amex">American Express</option>
                      <option value="ApplePay">Apple Pay</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={newCardIsDefault}
                    onChange={(e) => setNewCardIsDefault(e.target.checked)}
                    className="accent-[#d3a95d] w-4 h-4"
                  />
                  <span className="text-xs text-gray-600">Set as primary default payment card</span>
                </label>

                <button
                  type="submit"
                  className="w-full bg-[#d3a95d] text-black font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors shadow-lg mt-4 cursor-pointer"
                >
                  Save Payment Card
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
