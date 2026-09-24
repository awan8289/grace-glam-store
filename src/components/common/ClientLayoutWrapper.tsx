'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/loading/LoadingScreen';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthStore } from '@/store/useAuthStore';

const subscribeToNothing = () => () => {};

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  // Read sessionStorage during the first client render (never on the server) so
  // returning visitors skip the intro without a flash, and no effect is needed.
  const introAlreadyPlayed = useSyncExternalStore(
    subscribeToNothing,
    () => sessionStorage.getItem('gg_has_loaded') === 'true',
    () => true // server render: assume played, so the intro never blocks SSR markup
  );

  const [dismissed, setDismissed] = useState(false);
  const showIntro = !introAlreadyPlayed && !dismissed;

  // Checkout drops the marketing footer. On a phone it puts a newsletter form
  // and five columns of links between the shopper and the end of the page they
  // are trying to pay on.
  const isCheckout = usePathname() === '/checkout';

  // The session lives in an httpOnly cookie, so the client has to ask the
  // server who it is once per load.
  const refreshSession = useAuthStore((state) => state.refresh);
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleIntroComplete = () => {
    sessionStorage.setItem('gg_has_loaded', 'true');
    setDismissed(true);
  };

  return (
    <>
      {/*
        The page renders straight away and the intro sits on top of it. The
        previous version faded the whole tree from opacity 0, which blocked
        first paint of real content for the full intro duration.
      */}
      <div className="min-h-dvh flex flex-col bg-[#0a0a0a] text-[#E5E4E2]">
        <Navbar />
        <main className="flex-grow">{children}</main>
        {!isCheckout && <Footer />}
      </div>

      {/* Floating WhatsApp Quick Chat */}
      <WhatsAppButton />

      <AnimatePresence mode="wait">
        {showIntro && <LoadingScreen key="loading-screen" onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Global auth modal — available on every storefront page */}
      <AuthModal />
    </>
  );
}
