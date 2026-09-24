'use client';
import { motion } from 'framer-motion';

const features = [
  {
    id: 1,
    title: "Free Shipping Over A$150",
    desc: "To Australia and New Zealand.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    )
  },
  {
    id: 2,
    title: "30-Day Returns",
    desc: "Unworn, with tags still attached.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Online Support",
    desc: "24 hours a day, 7 days a week.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    )
  },
  {
    id: 4,
    title: "Secure Online Payment",
    desc: "Pay securely with credit card, Apple Pay, or Google Pay. No COD.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    )
  },
  {
    id: 5,
    title: "Premium Fabric",
    desc: "Elegance that stays with you. Crafted with the finest materials for lasting comfort.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    )
  },
  {
    id: 6,
    title: "Secure Payment",
    desc: "Shop with confidence. Our secure gateway ensures your information is protected every step of the way.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    )
  },
  {
    id: 7,
    title: "Style Suggestion",
    desc: "Not sure which fabric or length suits you? WhatsApp +61 494 794 408 or email sales@graceglam.com.au.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    )
  },
  {
    id: 8,
    title: "Careful Packaging",
    desc: "Folded and wrapped so it reaches you crease-free and ready to wear.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0-2.625V7.5m-9 0h18v2.25H3V7.5Z" />
      </svg>
    )
  }
];

const EXPECTATIONS = [
  {
    title: 'Shipping',
    body: 'Orders are packed within 1\u20132 business days. Free standard shipping on orders over A$150 to Australia and New Zealand; A$9.95 flat below that. Every parcel is tracked.',
  },
  {
    title: 'Returns',
    body: 'Thirty days to change your mind, provided the piece is unworn with its tags attached. Underscarves and hijab tape are final sale for hygiene reasons.',
  },
  {
    title: 'Honest descriptions',
    body: 'Fabric, length and composition are listed on every product page \u2014 blends are named as blends. If a piece needs an underscarf to sit opaque, the page says so.',
  },
];

export default function BrandStoryReviews() {
  return (
    <section className="bg-white py-20 md:py-24 text-gray-900 relative overflow-hidden border-t border-gray-100">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      <div className="max-w-[1250px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* ================= Brand Story Section ================= */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <div className="inline-block mb-4">
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-[#b8860b] px-4 py-1.5 rounded-full border border-[#b8860b]/20 bg-[#b8860b]/5">
              The Maison Philosophy
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-neutral-900 tracking-wide mb-6 leading-tight">
            Where Elegance Is <span className="text-[#b8860b]">Beautifully Wrapped</span>
          </h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light">
            Welcome to Grace &amp; Glam, a modern scarf brand created for women who appreciate timeless elegance, effortless style, and everyday comfort. Whether you wear your scarf as a hijab, a neck scarf, a shoulder wrap, or simply as a beautiful finishing touch to your outfit, we believe every woman should be able to style it in a way that feels uniquely hers.
          </p>
        </motion.div>

        {/* ================= Consolidated 8 Features Grid ================= */}
        <div className="mb-28">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-serif text-neutral-900 mb-2">The Grace & Glam Promise</h3>
            <p className="text-gray-500 text-sm">Experience seamless luxury with every order</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-neutral-50/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl p-6 text-center hover:border-[#b8860b]/40 hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Rotating Ring Icon Container ("Ghumna vali animation") */}
                  <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    {/* Continuous Rotating Dashed Ring */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-[#b8860b]/40 group-hover:border-[#b8860b] transition-colors"
                    />
                    
                    {/* Inner Solid Badge */}
                    <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-[#b8860b] group-hover:bg-[#b8860b] group-hover:text-white transition-colors duration-300">
                      {item.icon}
                    </div>
                  </div>

                  <h4 className="font-semibold text-neutral-900 text-base mb-2 group-hover:text-[#b8860b] transition-colors">
                    {item.title}
                  </h4>
                </div>

                <p className="text-gray-500 text-xs leading-relaxed font-light">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ================= What to expect ================= */}
        {/*
          This replaced three invented testimonials that carried named authors,
          five-star ratings and a "Verified Buyer" badge. Publishing those on a
          live store is misleading conduct under the Australian Consumer Law, and
          the badge made it worse by asserting a verification that never happened.
          Real reviews can go back here once there are real customers.
        */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-[#b8860b] block mb-2">
              Before You Order
            </span>
            <h2 className="text-3xl md:text-5xl font-serif text-neutral-900 tracking-wide mb-3">
              What To Expect
            </h2>
            <p className="text-gray-500 text-sm">
              The details worth knowing before your first order.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {EXPECTATIONS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-8 hover:border-[#b8860b]/40 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <h4 className="font-serif text-xl text-neutral-900 mb-3">{item.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed font-light">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
