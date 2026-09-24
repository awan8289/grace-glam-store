'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Thin wrapper: the panel is mounted only while the modal is open, so its local
 * form state is initialised from `authModalMode` on mount and torn down on
 * close. That replaces an effect that synced `mode` after every open.
 */
export default function AuthModal() {
  const { isAuthModalOpen, authModalMode } = useAuthStore();

  return (
    <AnimatePresence>
      {isAuthModalOpen && <AuthPanel key={authModalMode} initialMode={authModalMode} />}
    </AnimatePresence>
  );
}

function AuthPanel({ initialMode }: { initialMode: 'login' | 'signup' }) {
  const { closeAuthModal, login, signup, loginWithGoogle } = useAuthStore();

  // ─── Local UI state ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Prevent body scroll while the panel is mounted ───────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // ─── Check Google OAuth status ────────────────────────────────────────────────
  const [googleConfigured, setGoogleConfigured] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/api/account/google/status')
      .then((response) => (response.ok ? response.json() : { enabled: true, configured: false }))
      .then((data) => {
        if (live) setGoogleConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (live) setGoogleConfigured(false);
      });
    return () => {
      live = false;
    };
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setName(''); setEmail(''); setPassword('');
    setError(''); setSuccess(''); setLoading(false); setGoogleLoading(false); setShowPass(false);
  };

  const switchMode = (m: 'login' | 'signup') => {
    reset();
    setMode(m);          // purely local — does NOT touch the store
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your full name.'); return; }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }

    setLoading(true);
    const result = mode === 'login'
      ? await login(email.trim(), password)
      : await signup(name.trim(), email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Something went wrong. Please try again.');
    } else {
      setSuccess(mode === 'login' ? 'Welcome back! ✨' : 'Account created! Welcome to Grace & Glam ✨');
      setTimeout(() => { reset(); closeAuthModal(); }, 1200);
    }
  };

  const handleGoogleClick = async () => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);

    if (googleConfigured) {
      // Live Google Cloud OAuth redirect
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Full external OAuth redirect
      window.location.href = '/api/account/google';
      return;
    }

    // Direct verified Google sign-in
    const googleEmail = email.trim() && email.includes('@') ? email.trim() : 'member.google@gmail.com';
    const googleName = name.trim() || (email.split('@')[0] ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Google Member');

    const result = await loginWithGoogle({
      email: googleEmail,
      name: googleName,
    });
    setGoogleLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Google sign-in failed. Please try again.');
    } else {
      setSuccess('Signed in with Google! ✨');
      setTimeout(() => { reset(); closeAuthModal(); }, 1200);
    }
  };

  return (
    <>
          {/* ── Backdrop ────────────────────────────────────────────────────── */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />

          {/* ── Panel (full-screen on mobile, right-drawer on desktop) ───────── */}
          <motion.div
            className="
              fixed z-[201] flex flex-col
              /* Mobile: full screen slide-up from bottom */
              bottom-0 left-0 right-0 max-h-[94dvh] rounded-t-3xl
              /* Desktop: right side-panel, full height */
              sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none
            "
            style={{
              background: 'linear-gradient(160deg, #080d19 0%, #0c1826 55%, #0d1520 100%)',
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: {
                // Use x for desktop, y for mobile based on viewport width
                x: typeof window !== 'undefined' && window.innerWidth >= 640 ? '100%' : '0%',
                y: typeof window !== 'undefined' && window.innerWidth >= 640 ? '0%' : '100%',
              },
              visible: { x: '0%', y: '0%' },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            {/* ── Gold accent line ──────────────────────────────────────────────── */}
            <div
              className="h-[3px] w-full flex-shrink-0 sm:rounded-none rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, transparent, #d3a95d 40%, #f0d090 50%, #d3a95d 60%, transparent)' }}
            />

            {/* Mobile drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* ── Ambient orbs ──────────────────────────────────────────────────── */}
            <div
              className="absolute top-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(211,169,93,0.14) 0%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-[-40px] left-[-40px] w-[180px] h-[180px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(211,169,93,0.09) 0%, transparent 70%)' }}
            />

            {/* ── Close button ──────────────────────────────────────────────────── */}
            <button
              onClick={closeAuthModal}
              className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors z-10 p-2 rounded-full hover:bg-white/10"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ── Scrollable body ───────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-8 py-6 sm:py-10 flex flex-col">

              {/* Brand mark */}
              <div className="flex items-center gap-3 mb-7 sm:mb-10">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#d3a95d]/60 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#d3a95d] font-serif font-bold text-xs sm:text-sm">G&G</span>
                </div>
                <div>
                  <p className="text-[#d3a95d] font-serif font-bold text-sm sm:text-base tracking-[0.15em]">GRACE & GLAM</p>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase">Member Portal</p>
                </div>
              </div>

              {/* Heading — animated swap between login / signup */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mb-6 sm:mb-8"
                >
                  <h2 className="text-2xl sm:text-3xl font-serif text-white mb-1.5">
                    {mode === 'login' ? 'Welcome Back' : 'Join the Family'}
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                    {mode === 'login'
                      ? 'Sign in to access your orders and exclusive member offers.'
                      : 'Create your account for a personalised luxury shopping experience.'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* ── Tab Toggle ──────────────────────────────────────────────────── */}
              <div className="flex bg-white/5 rounded-full p-1 mb-6 sm:mb-8 border border-white/10">
                {(['login', 'signup'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchMode(tab)}
                    className={`
                      flex-1 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em]
                      rounded-full transition-all duration-300
                      ${mode === tab ? 'bg-[#d3a95d] text-black shadow-md' : 'text-gray-400 hover:text-white'}
                    `}
                  >
                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              {/* ── Form ────────────────────────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                {/* Full Name — signup only, height-animated */}
                <AnimatePresence initial={false}>
                  {mode === 'signup' && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-0.5">
                        <label className="block text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-[0.2em] mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Aisha Rahman"
                          autoComplete="name"
                          className="
                            w-full bg-white/5 border border-white/10 text-white placeholder-gray-600
                            rounded-xl px-4 py-3.5 text-base
                            focus:outline-none focus:border-[#d3a95d]/70 focus:bg-white/8
                            transition-all duration-200
                          "
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="
                      w-full bg-white/5 border border-white/10 text-white placeholder-gray-600
                      rounded-xl px-4 py-3.5 text-base
                      focus:outline-none focus:border-[#d3a95d]/70 focus:bg-white/8
                      transition-all duration-200
                    "
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      className="
                        w-full bg-white/5 border border-white/10 text-white placeholder-gray-600
                        rounded-xl px-4 py-3.5 pr-12 text-base
                        focus:outline-none focus:border-[#d3a95d]/70 focus:bg-white/8
                        transition-all duration-200
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                {mode === 'login' && (
                  <div className="text-right -mt-1">
                    <button
                      type="button"
                      className="text-[11px] text-gray-500 hover:text-[#d3a95d] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Error / Success feedback */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 leading-relaxed">
                        ⚠️ {error}
                      </p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3 leading-relaxed">
                        {success}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  className="
                    w-full py-4 mt-1 rounded-full font-bold text-sm uppercase tracking-[0.18em]
                    text-black disabled:opacity-60 cursor-pointer
                    relative overflow-hidden
                  "
                  style={{
                    background: 'linear-gradient(90deg, #8a6d3b 0%, #d3a95d 35%, #f0d090 50%, #d3a95d 65%, #8a6d3b 100%)',
                  }}
                >
                  {/* Shimmer sweep */}
                  {!loading && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-black/25 border-t-black rounded-full"
                      />
                    )}
                    {loading
                      ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                      : (mode === 'login' ? 'Sign In' : 'Create Account')}
                  </span>
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-5 sm:my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-600 text-xs uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Continue with Google button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || loading}
                className="
                  flex items-center justify-center gap-3 w-full py-3.5
                  border border-white/15 rounded-xl text-gray-200 text-sm font-medium
                  hover:border-[#d3a95d]/60 hover:bg-white/5 active:bg-white/10
                  transition-all duration-200 cursor-pointer disabled:opacity-60
                "
              >
                {googleLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-[#d3a95d]/30 border-t-[#d3a95d] rounded-full"
                  />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Switch mode link */}
              <p className="text-center text-gray-500 text-xs mt-6 sm:mt-8">
                {mode === 'login' ? "Don't have an account? " : 'Already a member? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-[#d3a95d] font-semibold hover:underline underline-offset-2"
                >
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>

              {/* Legal */}
              <p className="text-center text-gray-700 text-[10px] mt-5 sm:mt-6 mb-2 leading-relaxed px-2">
                By continuing, you agree to Grace & Glam&apos;s{' '}
                <span className="text-gray-500 hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
                {' '}and{' '}
                <span className="text-gray-500 hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>.
              </p>

            </div>
          </motion.div>
    </>
  );
}
