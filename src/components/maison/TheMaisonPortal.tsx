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
          Welcome to Grace &amp; Glam, a modern scarf brand created for women who appreciate timeless
          elegance, effortless style, and everyday comfort.
        </p>

        <p className={p}>
          We believe a scarf is more than just an accessory. It can express your personality,
          complement your outfit, and add a touch of confidence to every look.
        </p>

        <p className={p}>
          At Grace &amp; Glam, we carefully select scarves that combine style, versatility, comfort,
          and timeless beauty. Our collection is designed for women who love to express themselves
          through elegant and effortless fashion.
        </p>

        <p className={p}>
          Whether you wear your scarf as a hijab, a neck scarf, a shoulder wrap, or simply as a
          beautiful finishing touch to your outfit, we believe every woman should be able to style
          it in a way that feels uniquely hers.
        </p>

        <p className={p}>
          Our goal is simple: to bring beautiful scarves into your everyday wardrobe while making
          online shopping easy, enjoyable, and inspiring.
        </p>

        <div className="pt-6 border-t border-gray-100">
          <h3 className={h3}>Our Philosophy</h3>
          <p className="text-base font-serif italic text-[#d3a95d] mb-3">
            Timeless. Elegant. Effortless.
          </p>
          <p className={p}>
            We believe true elegance does not need to be complicated.
          </p>
          <p className={p}>
            Rather than focusing only on short-lived trends, we love styles, colours, and textures
            that can remain beautiful season after season.
          </p>
          <p className={p}>
            Every Grace &amp; Glam piece is chosen with attention to its appearance, feel, versatility,
            and ability to complement different personal styles.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className={h3}>Designed for Every Woman</h3>
          <p className={p}>
            Grace &amp; Glam celebrates women with different styles, cultures, and ways of wearing
            scarves.
          </p>
          <p className={p}>
            Our collection is suitable for modest fashion, everyday styling, special occasions, work,
            travel, and everything in between.
          </p>
          <p className={p}>
            Whether you are looking for a sophisticated everyday scarf, a beautiful shawl, or a
            versatile piece to complete your outfit, Grace &amp; Glam is here to help you find your
            style.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className={h3}>Our Promise</h3>
          <p className={p}>
            At Grace &amp; Glam, we are committed to providing:
          </p>
          <ul className={ul}>
            <li>Elegant and versatile scarf designs</li>
            <li>Carefully selected fabrics and textures</li>
            <li>Timeless and wearable colours</li>
            <li>Quality-focused products</li>
            <li>Clear and honest product information</li>
            <li>Thoughtful customer service</li>
            <li>A simple and enjoyable shopping experience</li>
          </ul>

          <div className="mt-8 p-6 bg-[#faf8f4] border border-[#e5d5b7] rounded-2xl text-center">
            <p className="font-serif text-xl md:text-2xl text-black font-medium">
              Grace &amp; Glam &mdash; Wrap Yourself in Elegance.
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
          <h2 className={h2}>Where Every Detail Matters</h2>
          <p className={subtitle}>Fabric, Finishing &amp; Craftsmanship</p>
        </div>

        <p className={p}>
          At Grace &amp; Glam, beauty is in the details.
        </p>

        <p className={p}>
          From the texture and drape of the fabric to the colours and finishing touches, every piece
          is selected with style, comfort, and versatility in mind.
        </p>

        <p className={p}>
          We believe a beautiful scarf should not only look elegant but also feel comfortable and
          effortless to wear.
        </p>

        <p className={p}>
          Our collection is designed to give you the freedom to style your scarf your way &mdash;
          whether you&apos;re creating a modest look, adding a sophisticated touch to an outfit, or
          simply enjoying the beauty of a timeless accessory.
        </p>

        <div className="mt-8 p-8 bg-[#faf8f4] border border-[#e5d5b7] rounded-2xl text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d3a95d] font-bold">
            The Art of Wearing
          </p>
          <p className="font-serif text-2xl md:text-3xl text-black font-semibold">
            Simply wrap. Style. Make it yours.
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
          <p className={subtitle}>Built on six pillars of quality, beauty, and care</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">1. Timeless Elegance</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              We choose styles that can complement your wardrobe season after season.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">2. Versatile Styling</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Style your scarf as a hijab, neck scarf, shoulder wrap, or fashion accessory.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">3. Comfort Meets Style</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              We believe looking beautiful should never mean compromising on comfort.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">4. Carefully Selected</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              We pay attention to fabric, texture, colour, finishing, and overall presentation.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">5. Made for Modern Women</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Our collection brings together timeless elegance and contemporary fashion.
            </p>
          </div>

          <div className="p-6 bg-[#faf8f4] border border-gray-200/80 rounded-2xl space-y-2">
            <h4 className="font-serif text-xl font-bold text-black">6. A Beautiful Shopping Experience</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              From browsing our collection to receiving your order, we want every part of your Grace &amp; Glam experience to feel special.
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
            Delivery Information
          </span>
          <h2 className={h2}>Shipping Information</h2>
          <p className={subtitle}>
            We want your Grace &amp; Glam order to reach you safely and conveniently.
          </p>
        </div>

        <div>
          <h3 className={h3}>Order Processing</h3>
          <p className={p}>
            Orders are carefully prepared and dispatched within our stated processing timeframe (1&ndash;2 business days).
          </p>
          <p className={p}>
            Once your order has been shipped, you will receive tracking information where available.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Delivery</h3>
          <p className={p}>
            Delivery times may vary depending on your location, shipping method, courier, and
            circumstances outside our control.
          </p>
          <p className={p}>
            Please ensure your shipping address is correct before completing your order.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Express Shipping</h3>
          <p className={p}>
            Where express shipping is available, the estimated delivery timeframe and shipping cost
            will be displayed at checkout.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Delayed or Lost Orders</h3>
          <p className={p}>
            If your order appears to be delayed or has not arrived within the expected timeframe,
            please contact our customer service team with your order details so we can assist you.
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
            Returns &amp; Exchanges
          </span>
          <h2 className={h2}>Returns &amp; Exchanges</h2>
          <p className={subtitle}>We want you to love your Grace &amp; Glam purchase.</p>
        </div>

        <p className={p}>
          Our returns policy explains the conditions and process for returning or exchanging eligible
          products.
        </p>
        <p className={p}>
          Please contact us before sending an item back so that we can guide you through the correct
          process.
        </p>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Change of Mind</h3>
          <p className={p}>
            If you are returning an item because you have changed your mind, eligibility will depend
            on the conditions outlined in our Returns Policy (within 30 days of delivery, in unworn
            original condition with tags).
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Faulty or Incorrect Items</h3>
          <p className={p}>
            If your item arrives faulty, damaged, or different from what you ordered, please contact
            us as soon as possible with your order number and photographs where appropriate.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className={h3}>Australian Consumer Law</h3>
          <p className={p}>
            Your rights under the Australian Consumer Law are not affected by our store return policy.
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
          <p className={p}>
            For full details about how personal information is collected, used, stored, and disclosed,
            please refer to our complete Privacy Policy.
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
            Have a question about a scarf, your order, shipping, returns, or styling?
          </p>
        </div>

        <p className={p}>
          Our team is here to help you find the perfect piece and assist with any inquiries.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-6 bg-[#faf8f4] border border-gray-200 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-[#d3a95d] font-bold mb-1">Email</p>
            <a
              href="mailto:sales@graceglam.com.au"
              className="text-black font-semibold text-sm sm:text-base hover:text-[#d3a95d] transition-colors break-all"
            >
              sales@graceglam.com.au
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
            Follow us on social media for new collections, styling inspiration, and Grace &amp; Glam
            updates.
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
