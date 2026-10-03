'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

/**
 * Brand and policy portal for Grace & Glam.
 *
 * All pages (/maison, /about, /atelier, /shipping-returns, /refund-policy,
 * /privacy-policy, /terms-conditions) share this portal and render clean,
 * refined typography without clutter or stock photos.
 */
const tabs = [
  { id: 'about', title: 'The Maison & About Us' },
  { id: 'atelier', title: 'The Atelier' },
  { id: 'why-us', title: 'Why Grace & Glam?' },
  { id: 'shipping', title: 'Shipping Policy' },
  { id: 'returns', title: 'Refund & Returns' },
  { id: 'privacy', title: 'Privacy Policy' },
  { id: 'terms', title: 'Terms & Conditions' },
  { id: 'contact', title: 'Contact Us' },
];

interface TheMaisonPortalProps {
  initialTab?: string;
}

const h2 = 'text-3xl md:text-5xl font-serif text-black mb-3 tracking-wide';
const h3 = 'text-xl md:text-2xl font-serif text-black mt-8 mb-3 font-semibold';
const subtitle = 'text-sm md:text-base font-serif italic text-[#9b783e] mb-6 font-medium';
const p = 'text-gray-700 leading-relaxed font-light text-base md:text-lg mb-4';
const ul = 'list-disc pl-6 space-y-2 text-gray-700 font-light text-base md:text-lg mb-6';

export default function TheMaisonPortal({ initialTab = 'about' }: TheMaisonPortalProps) {
  // Normalize incoming initialTab
  const normalizedInitial =
    initialTab === 'maison' || initialTab === 'our-story'
      ? 'about'
      : tabs.some((t) => t.id === initialTab)
      ? initialTab
      : 'about';

  const [activeTab, setActiveTab] = useState(normalizedInitial);

  const content: Record<string, React.ReactNode> = {
    // ---------------------------------------------------------------------
    // 1. THE MAISON / ABOUT US
    // ---------------------------------------------------------------------
    about: (
      <div className="space-y-6 max-w-3xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            The Maison
          </span>
          <h2 className={h2}>About Us</h2>
          <p className={subtitle}>
            Grace &amp; Glam &mdash; Where Elegance Is Beautifully Wrapped
          </p>
        </div>

        <p className={p}>
          Welcome to Grace &amp; Glam, a premier Australian bespoke atelier dedicated to immortalizing your most meaningful moments and beloved companions.
        </p>

        <p className={p}>
          We believe personalized art and jewelry are more than decorative pieces &mdash; they are emotional anchors, celebrations of loved ones, and heirlooms that tell your personal story.
        </p>

        <p className={p}>
          At Grace &amp; Glam you&apos;ll find <strong>Custom Photo Paintings</strong>, where a favourite photo of your home, family or a special place becomes canvas wall art, alongside a curated range of necklaces, earrings and keepsake gift boxes.
        </p>

        <p className={p}>
          Every custom photo order is checked by our team before it goes into production.
        </p>

        <p className={p}>
          Our goal is simple: thoughtful gifts, honest descriptions, caring support and free delivery across Australia.
        </p>

        <div className="pt-6 border-t border-gray-100">
          <h3 className={h3}>Our Philosophy</h3>
          <p className="text-base font-serif italic text-[#d3a95d] mb-3">
            Bespoke. Meaningful. Uncompromising.
          </p>
          <p className={p}>
            We believe true luxury is personal. A gift means most when it carries a memory &mdash; like a painting of the place you call home.
          </p>
          <p className={p}>
            We choose every piece in our collection with gifting in mind.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className={h3}>The Grace &amp; Glam Promise</h3>
          <ul className={ul}>
            <li>Free tracked delivery on every order, Australia-wide</li>
            <li>12-hour window to change your photo after checkout</li>
            <li>Damaged, faulty or not as described? We replace it or refund you</li>
            <li>Support via WhatsApp and email</li>
          </ul>

          <div className="mt-8 p-6 bg-[#faf8f4] border border-[#e5d5b7] rounded-2xl text-center">
            <p className="font-serif text-xl md:text-2xl text-black font-medium">
              Grace &amp; Glam &mdash; Elegance Made Personal.
            </p>
          </div>
        </div>
      </div>
    ),

    // ---------------------------------------------------------------------
    // 2. THE ATELIER
    // ---------------------------------------------------------------------
    atelier: (
      <div className="space-y-6 max-w-3xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            The Atelier
          </span>
          <h2 className={h2}>Crafting Your Keepsakes</h2>
          <p className={subtitle}>How your custom photo painting is made</p>
        </div>

        <p className={p}>
          At Grace &amp; Glam, precision craftsmanship bridges the gap between digital memory and tangible heirloom.
        </p>

        <div className="space-y-4 pt-2">
          <h3 className={h3}>Custom Photo Paintings</h3>
          <p className={p}>
            Upload a photo on the product page, choose a canvas size, and we check it before it goes into production. Canvases ship rolled in a protective tube.
          </p>
        </div>

        <div className="mt-8 p-8 bg-[#faf8f4] border border-[#e5d5b7] rounded-2xl text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d3a95d] font-bold">
            The Atelier Standard
          </p>
          <p className="font-serif text-2xl md:text-3xl text-black font-semibold">
            Your photo, made into something to keep.
          </p>
        </div>
      </div>
    ),

    // ---------------------------------------------------------------------
    // 3. WHY GRACE & GLAM?
    // ---------------------------------------------------------------------
    'why-us': (
      <div className="space-y-6 max-w-4xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            Our Distinction
          </span>
          <h2 className={h2}>Why Grace &amp; Glam?</h2>
          <p className={subtitle}>What you can count on with every order</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">1. Custom Photo Rendition</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Every customer photo is checked before production so the finished canvas looks its best.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">2. Free Delivery, Every Order</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tracked delivery anywhere in Australia, with no minimum spend and no delivery charges.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">3. 12-Hour Photo Change Window</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Want a different photo after paying? Reply to your order email within 12 hours and we will update it before production.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">4. Secure Checkout</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Pay by card, Apple Pay or Google Pay through Stripe. We never see or store your card number.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">5. Arrives As Described</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              If an item arrives damaged, faulty or not as described, send us a photo and we will replace it or refund you.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">6. Real Support</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Message us on WhatsApp (+61 494 794 408) or email for help with sizing, photos or your order.
            </p>
          </div>
        </div>
      </div>
    ),

    // ---------------------------------------------------------------------
    // 4. SHIPPING POLICY
    // ---------------------------------------------------------------------
    shipping: (
      <div className="space-y-6 max-w-3xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            Australia-Wide Delivery
          </span>
          <h2 className={h2}>Shipping &amp; Delivery</h2>
          <p className={subtitle}>
            Fast, secure, and fully tracked domestic delivery across Australia.
          </p>
        </div>

        <div>
          <h3 className={h3}>Free Delivery on Every Order</h3>
          <p className={p}>
            Delivery is <strong>free on every order</strong> anywhere in Australia — no minimum spend and no delivery charges.
          </p>
          <p className={p}>
            Every order is dispatched with an official Australia Post tracking number sent straight to your email and SMS.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Bespoke Crafting &amp; Dispatch Timeline</h3>
          <p className={p}>
            Because each personalized gold necklace is individually laser-cut and each photo canvas is made to order, production takes 5&ndash;7 business days before dispatch.
          </p>
          <p className={p}>
            Once dispatched, standard delivery across NSW, VIC, QLD, WA, SA, TAS, and NT typically arrives within 3&ndash;7 business days.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Address Changes &amp; Inquiries</h3>
          <p className={p}>
            You have a 12-hour grace period after placing your order to amend your shipping address or correct name spellings. For urgent updates, message our Australian team directly on WhatsApp (+61 494 794 408).
          </p>
        </div>
      </div>
    ),

    // ---------------------------------------------------------------------
    // 5. REFUND & RETURNS
    // ---------------------------------------------------------------------
    returns: (
      <div className="space-y-6 max-w-3xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            Returns &amp; Guarantee Policy
          </span>
          <h2 className={h2}>Refund &amp; Returns Policy</h2>
          <p className={subtitle}>Transparent, honest policies complying with the Australian Consumer Law.</p>
        </div>

        <p className={p}>
          Every Grace &amp; Glam piece &mdash; from our necklaces to custom photo paintings &mdash; is individually crafted to order according to your personal specifications.
        </p>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Change of Mind Policy (Made-to-Order &amp; Personalised Goods)</h3>
          <p className={p}>
            In accordance with the <strong>Australian Consumer Law (ACL)</strong>, because each piece is uniquely personalized and custom-manufactured specifically for you, <strong>personalised and made-to-order items cannot be returned or refunded for change of mind</strong> once crafting has begun.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Order Cancellation &amp; Modification Window</h3>
          <p className={p}>
            We provide a strict <strong>12-hour grace window</strong> immediately following your order confirmation:
          </p>
          <ul className={ul}>
            <li><strong>Within 12 hours:</strong> You may cancel your order for a 100% full refund, amend your shipping address, or modify your custom text, inscription font, or photo upload with zero fees.</li>
            <li><strong>After 12 hours:</strong> Laser cutting, metal electroplating, and custom drill canvas printing commence. Once production has started, cancellations or change of mind returns cannot be accepted.</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Spelling Mistakes &amp; Customer Inscription Errors</h3>
          <p className={p}>
            We know mistakes can happen. Here is how we handle spelling discrepancies:
          </p>
          <ul className={ul}>
            <li><strong>Workshop or Production Error:</strong> If the engraved name, script, or canvas rendering differs in any way from the text you submitted at checkout, we will immediately rush a <strong>100% free remake</strong> at our expense, or provide a full immediate refund. You will never be asked to return the faulty item.</li>
            <li><strong>Customer-Submitted Typo:</strong> If you notice an error in the name you provided after our 12-hour grace period has elapsed, please reach out to us immediately. While we cannot offer a full refund for customer typos, we understand how important the gift is and will provide a heavily subsidized remake at direct workshop cost (up to 50% discount).</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Faulty, Damaged, or Misdescribed Items (ACL Consumer Guarantees)</h3>
          <p className={p}>
            Our goods come with guarantees that cannot be excluded under the Australian Consumer Law. You are entitled to a replacement or refund for a major failure and compensation for any other reasonably foreseeable loss or damage. You are also entitled to have the goods repaired or replaced if the goods fail to be of acceptable quality and the failure does not amount to a major failure.
          </p>
          <p className={p}>
            If your piece arrives with a broken clasp, transit damage, tarnishing, or defective resin drills, simply contact our Sydney team with your order number and a clear photo via WhatsApp (<strong>+61 494 794 408</strong>) or email (<strong>graceandglame.au@gmail.com</strong>) within 30 days of arrival.
          </p>
        </div>
      </div>
    ),

    // ---------------------------------------------------------------------
    // 6. PRIVACY POLICY
    // ---------------------------------------------------------------------
    privacy: (
      <div className="space-y-6 max-w-3xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            Privacy Policy
          </span>
          <h2 className={h2}>Your Privacy Matters</h2>
          <p className={subtitle}>Transparency in how your data is handled and protected.</p>
        </div>

        <p className={p}>
          At Grace &amp; Glam, we respect your privacy and are committed to protecting your personal
          information.
        </p>
        <p className={p}>
          When you shop with us or interact with our website, we may collect information such as your
          name, email address, contact details, shipping information, and order details.
        </p>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>How We Use Your Information</h3>
          <p className={p}>We may use your information to:</p>
          <ul className={ul}>
            <li>Process and fulfil your orders</li>
            <li>Arrange delivery</li>
            <li>Provide customer support</li>
            <li>Communicate with you about your orders</li>
            <li>Improve our website and services</li>
            <li>Prevent fraud and protect our business</li>
            <li>Send marketing communications where you have chosen to receive them</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Payment Information</h3>
          <p className={p}>
            Payments may be processed securely through third-party payment providers. We do not need
            to store your complete payment card details ourselves where payment is handled by these
            providers.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Cookies</h3>
          <p className={p}>
            Our website may use cookies and similar technologies to improve functionality, understand
            website usage, remember preferences, and provide a better shopping experience.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Third-Party Services</h3>
          <p className={p}>
            We may work with trusted third-party providers for services such as payment processing,
            delivery, analytics, website functionality, and marketing.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Storage &amp; Overseas Disclosure</h3>
          <p className={p}>
            Your account and order details are stored with our cloud database provider. Card payments
            are handled by Stripe, so your full card number never reaches us. To deliver your order we
            share your name, delivery address and phone number with our fulfilment and delivery
            partners, some of whom are located outside Australia. Photos you upload for a custom piece
            are used only to make that piece.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Access, Correction &amp; Deletion</h3>
          <p className={p}>
            You can update your name, phone and addresses in your account at any time. To get a copy of
            the information we hold about you, correct it, or ask us to delete your account, email{' '}
            <a href="mailto:graceandglame.au@gmail.com" className="underline">graceandglame.au@gmail.com</a>.
            We may keep order records where the law requires us to. If you are unhappy with how we
            handled a privacy request, you can contact the Office of the Australian Information
            Commissioner (oaic.gov.au).
          </p>
        </div>
      </div>
    ),

    // ---------------------------------------------------------------------
    // 7. TERMS & CONDITIONS
    // ---------------------------------------------------------------------
    terms: (
      <div className="space-y-6 max-w-3xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            Terms &amp; Conditions
          </span>
          <h2 className={h2}>Welcome to Grace &amp; Glam</h2>
          <p className={subtitle}>Official terms of boutique service and online store usage.</p>
        </div>

        <p className={p}>
          These Terms &amp; Conditions apply to your use of the Grace &amp; Glam website and purchases
          made through our online store.
        </p>
        <p className={p}>
          By using our website or placing an order, you agree to comply with these terms.
        </p>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Products</h3>
          <p className={p}>
            We make every effort to ensure product descriptions, colours, photographs, measurements,
            and other information are accurate.
          </p>
          <p className={p}>
            However, colours may appear slightly different depending on your device or screen
            settings.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Pricing</h3>
          <p className={p}>
            All product prices are displayed in the applicable currency shown on our website (AUD).
          </p>
          <p className={p}>
            Prices may change from time to time without prior notice, but changes will not affect an
            order that has already been accepted unless required by law.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Orders</h3>
          <p className={p}>
            Once you place an order, you will receive an order confirmation.
          </p>
          <p className={p}>
            We reserve the right to cancel an order in circumstances such as product availability
            issues, pricing errors, suspected fraudulent activity, or other legitimate reasons,
            subject to applicable law.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Intellectual Property</h3>
          <p className={p}>
            All website content, including our brand name, logo, photographs, graphics, written
            content, and designs, belongs to Grace &amp; Glam or is used with permission.
          </p>
          <p className={p}>
            You may not reproduce, copy, modify, distribute, or use our content without permission.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Australian Consumer Law</h3>
          <p className={p}>
            Nothing in these Terms &amp; Conditions is intended to exclude, restrict, or modify any
            rights or remedies that cannot legally be excluded under applicable consumer protection
            laws.
          </p>
        </div>
      </div>
    ),

    // ---------------------------------------------------------------------
    // 8. CONTACT US
    // ---------------------------------------------------------------------
    contact: (
      <div className="space-y-6 max-w-3xl">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#d3a95d] font-bold block mb-2">
            Get In Touch
          </span>
          <h2 className={h2}>We’d Love to Hear From You</h2>
          <p className={subtitle}>
            Have a question about a product, your custom photo painting, delivery, or returns?
          </p>
        </div>

        <p className={p}>
          Our Australian team is here to guide your custom commission and assist with any inquiries.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-6 bg-[#faf8f4] border border-gray-200 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-[#d3a95d] font-bold mb-1">Email</p>
            <a
              href="mailto:graceandglame.au@gmail.com"
              className="text-black font-semibold text-sm sm:text-base hover:text-[#d3a95d] transition-colors break-all"
            >
              graceandglame.au@gmail.com
            </a>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-[#25D366] font-bold mb-1">WhatsApp / Call</p>
            <a
              href="https://wa.me/61494794408"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black font-semibold text-sm sm:text-base hover:text-[#25D366] transition-colors"
            >
              +61 494 794 408
            </a>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-[#d3a95d] font-bold mb-1">Location</p>
            <p className="text-black font-semibold text-sm sm:text-base">Australia</p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className={h3}>Follow Grace &amp; Glam</h3>
          <p className={p}>
            Follow us on social media for new bespoke drops, customer commissions, and Grace &amp; Glam
            atelier updates.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="https://www.instagram.com/graceandglam.au"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-[#d3a95d] hover:text-black transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/graceandglam.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-[#d3a95d] hover:text-black transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://wa.me/61494794408"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] text-white text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-[#1ebd5a] transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="bg-white min-h-dvh pt-10 md:pt-32 pb-24 text-black font-sans">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">

        {/* Header Title */}
        <div className="text-center mb-12 border-b border-gray-200 pb-8">
          <p className="text-[#d3a95d] uppercase tracking-[0.3em] text-xs font-bold mb-3">
            Grace &amp; Glam Boutique
          </p>
          <h1 className="text-4xl md:text-6xl font-serif tracking-wide">
            {tabs.find((t) => t.id === activeTab)?.title || 'The Maison'}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* ================= LEFT SIDEBAR (Navigation) ================= */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-28 flex flex-col gap-1 bg-[#faf8f4] p-4 rounded-2xl border border-gray-200">
              <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold px-3 py-2">
                Navigation
              </span>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left py-3 px-4 rounded-xl transition-all duration-200 font-serif tracking-wide text-base cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-black text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:text-black hover:bg-white/80'
                  }`}
                >
                  {tab.title}
                </button>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-200/60 px-3 pb-2">
                <Link
                  href="/shop"
                  className="text-xs uppercase tracking-widest text-[#d3a95d] font-bold hover:underline inline-flex items-center gap-1.5"
                >
                  Explore Collection &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* ================= RIGHT CONTENT AREA ================= */}
          <div className="w-full lg:w-2/3 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                {content[activeTab] ?? content.about}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
