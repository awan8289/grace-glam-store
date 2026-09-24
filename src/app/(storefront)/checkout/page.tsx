'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore, Order } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/format';
import { BRAND_CONFIG } from '@/constants/config';
import { useIsHydrated } from '@/lib/useIsHydrated';

/**
 * Every input in checkout shares this.
 *
 * `text-base` is not a style choice — it is 16px, and iOS Safari zooms the whole
 * page in whenever a focused field is smaller than that. It does not zoom back
 * out, so a shopper who tapped "Postcode" spends the rest of the checkout
 * scrolling sideways.
 */
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-base text-black bg-white focus:ring-2 focus:ring-[#d3a95d] outline-none';

const AUSTRALIAN_STATES = [
  'New South Wales (NSW)',
  'Victoria (VIC)',
  'Queensland (QLD)',
  'Western Australia (WA)',
  'South Australia (SA)',
  'Tasmania (TAS)',
  'Australian Capital Territory (ACT)',
  'Northern Territory (NT)',
];

export default function CheckoutPage() {
  const { user, isLoggedIn, isReady, openAuthModal, loginWithGoogle, addAddress, addSavedCard } = useAuthStore();
  const { items: cartItems, getTotalPrice, clearCart } = useCartStore();

  const mounted = useIsHydrated();
  const totalPrice = getTotalPrice();

  // Step management: 1 = Address, 2 = Payment, 3 = Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // `null` = untouched, so the user's default address is used automatically.
  const [addressChoice, setAddressChoice] = useState<string | null>(null);
  const [addAddressFormOpen, setAddAddressFormOpen] = useState<boolean | null>(null);

  // New Address Form Inputs
  const [newLabel, setNewLabel] = useState('Home');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState(AUSTRALIAN_STATES[0]);
  const [newZip, setNewZip] = useState('');
  const [addressError, setAddressError] = useState('');

  // Payment Method State
  const [paymentChoice, setPaymentChoice] = useState<'card' | 'applepay' | 'saved_card' | null>(null);
  const [cardChoice, setCardChoice] = useState<string | null>(null);
  
  // New Card Inputs
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);
  const [paymentError, setPaymentError] = useState('');

  // Order Placement State
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Everything below is derived from the store rather than copied into state by
  // an effect, so the defaults are correct on the very first render.
  const savedAddresses = user?.addresses ?? [];
  const savedCards = user?.savedCards ?? [];

  const defaultAddressId =
    (savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0])?.id ?? '';
  const selectedAddressId = addressChoice ?? defaultAddressId;
  const setSelectedAddressId = setAddressChoice;

  const showAddAddressForm = addAddressFormOpen ?? savedAddresses.length === 0;
  const setShowAddAddressForm = setAddAddressFormOpen;

  const defaultCardId = (savedCards.find((c) => c.isDefault) ?? savedCards[0])?.id ?? '';
  const selectedSavedCardId = cardChoice ?? defaultCardId;
  const setSelectedSavedCardId = setCardChoice;

  const paymentType = paymentChoice ?? (savedCards.length > 0 ? 'saved_card' : 'card');
  const setPaymentType = setPaymentChoice;

  // Handle Save New Address
  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!newName.trim() || !newPhone.trim() || !newStreet.trim() || !newCity.trim() || !newZip.trim()) {
      setAddressError('Please fill in all address fields.');
      return;
    }

    const newAddrData = {
      label: newLabel || 'Home',
      fullName: newName.trim(),
      phone: newPhone.trim(),
      street: newStreet.trim(),
      city: newCity.trim(),
      state: newState,
      country: 'Australia',
      zipCode: newZip.trim(),
      isDefault: !user?.addresses || user.addresses.length === 0,
    };

    addAddress(newAddrData);

    // `addAddress` writes synchronously, so the new id is available immediately.
    const updated = useAuthStore.getState().user?.addresses ?? [];
    const latest = updated[updated.length - 1];
    if (latest) setSelectedAddressId(latest.id);
    setShowAddAddressForm(false);
  };

  // Move to Step 2 (Payment)
  const handleProceedToPayment = () => {
    setAddressError('');
    if (!selectedAddressId && !showAddAddressForm) {
      setAddressError('Please select a delivery location.');
      return;
    }
    if (showAddAddressForm) {
      if (!newName.trim() || !newPhone.trim() || !newStreet.trim() || !newCity.trim() || !newZip.trim()) {
        setAddressError('Please save your location first or select an existing address.');
        return;
      }
    }
    setCurrentStep(2);
  };

  // Handle Final Order Placement
  const handlePlaceOrder = async () => {
    setPaymentError('');

    if (paymentType === 'card') {
      if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
        setPaymentError('Please enter valid credit/debit card details.');
        return;
      }
    }

    if (paymentType === 'saved_card' && !selectedSavedCardId) {
      setPaymentError('Please select a saved payment card.');
      return;
    }

    setIsProcessingOrder(true);

    // Build the payment label in the browser. The full card number and CVC are
    // used only to derive the last four digits and never leave this function.
    let payMethodName = 'Apple Pay';
    if (paymentType === 'card') {
      const lastFour = cardNumber.replace(/\D/g, '').slice(-4) || '4242';
      payMethodName = `Card ending in ${lastFour}`;
      if (saveCardForFuture) {
        await addSavedCard({
          cardholderName: cardName.toUpperCase() || 'CARDHOLDER',
          cardNumberMasked: lastFour,
          expiryDate: cardExpiry || '12/28',
          brand: 'Visa',
          isDefault: true,
        });
      }
    } else if (paymentType === 'saved_card') {
      const card = user?.savedCards?.find((entry) => entry.id === selectedSavedCardId);
      payMethodName = card
        ? `${card.brand} ending in ${card.cardNumberMasked.slice(-4)}`
        : 'Saved card';
    }

    try {
      // The server prices the order from the catalogue, reserves stock and
      // records it — the client only says what it wants.
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod: payMethodName,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            variantId: item.product.variants.find(
              (variant) => variant.colorName === item.selectedColor
            )?.id,
            size: item.selectedSize,
            quantity: item.quantity,
          })),
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not place the order.');

      // Pull the new order into the account view.
      await useAuthStore.getState().refresh();

      clearCart();
      setCompletedOrder(body.order as Order);
      setCurrentStep(3);
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : 'Could not place the order.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Loading state
  if (!mounted || !isReady) {
    return (
      <div className="min-h-dvh bg-[#faf9f6] pt-10 md:pt-32 pb-20 px-4 flex justify-center items-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-black/20 border-t-black animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Loading checkout session...</p>
        </div>
      </div>
    );
  }

  // Render Authentication Wall
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-dvh bg-[#faf9f6] pt-10 md:pt-32 pb-20 px-4 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 md:p-10 rounded-2xl shadow-2xl border border-[#e5d5b7] text-center space-y-6"
        >
          <div className="w-16 h-16 bg-[#faf6ed] rounded-full flex items-center justify-center mx-auto border border-[#d3a95d]">
            <svg className="w-8 h-8 text-[#d3a95d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-serif text-black mb-2">Authentication Required</h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Please log in or register your account to proceed with your express delivery order in Australia.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full bg-black text-white py-3.5 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#d3a95d] hover:text-black transition-colors rounded-xl shadow-lg cursor-pointer"
            >
              Sign In / Register
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await loginWithGoogle();
                if (res.success) {
                  window.location.reload();
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl text-gray-700 text-xs font-semibold uppercase tracking-wider hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
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
          <div>
            <Link href="/shop" className="text-xs text-gray-400 hover:text-black transition-colors underline">
              Return to Boutique Catalog
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Empty Cart Screen (if not completed order)
  if (cartItems.length === 0 && currentStep !== 3) {
    return (
      <div className="min-h-dvh bg-[#faf9f6] pt-10 md:pt-32 pb-20 px-4 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-black mb-2">Your Shopping Bag is Empty</h2>
          <p className="text-gray-500 text-sm mb-8">Add handcrafted luxury items to your cart before checking out.</p>
          <Link
            href="/shop"
            className="inline-block w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#d3a95d] hover:text-black transition-colors rounded-xl shadow-lg"
          >
            Explore Boutique Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  // Render Step 3: Order Confirmation Success Screen
  if (currentStep === 3 && completedOrder) {
    return (
      <div className="min-h-dvh bg-[#faf9f6] pt-10 md:pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-[#e5d5b7] text-center"
          >
            <div className="w-20 h-20 bg-[#faf6ed] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#d3a95d]">
              <svg className="w-10 h-10 text-[#d3a95d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <span className="inline-block px-4 py-1.5 bg-[#faf6ed] text-[#b8860b] text-xs font-semibold uppercase tracking-widest rounded-full mb-3 border border-[#e5d5b7]">
              Australia Express Order Confirmed
            </span>
            <h1 className="text-3xl md:text-4xl font-serif text-black mb-3">Thank You for Your Order!</h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Your order <strong className="text-black font-semibold">{completedOrder.id}</strong> has been received and sent to our Sydney Atelier for packaging.
            </p>

            {/* Order Details Card */}
            <div className="bg-[#faf9f6] rounded-2xl p-6 text-left mb-8 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">Order ID</span>
                <span className="text-base font-serif font-bold text-black">{completedOrder.id}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">Estimated Delivery</span>
                <span className="text-sm font-semibold text-black">{completedOrder.estimatedDelivery}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">Destination</span>
                <span className="text-sm font-semibold text-black">Australia 🇦🇺</span>
              </div>
            </div>

            {/* Address & Tracking summary */}
            <div className="bg-[#faf6ed]/50 rounded-2xl p-6 text-left mb-8 border border-[#e5d5b7]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#b8860b] mb-2">Delivery Location Selected</h3>
              <p className="text-sm text-gray-800 font-medium leading-relaxed">{completedOrder.shippingAddress}</p>
            </div>

            {/* Tracking Steps Preview */}
            <div className="mb-10 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Live Order Status</h3>
              <div className="space-y-4">
                {completedOrder.trackingSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      step.status === 'completed'
                        ? 'bg-[#d3a95d] text-white'
                        : step.status === 'current'
                        ? 'bg-black text-white animate-pulse'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                      <span className="text-[11px] text-gray-400 mt-0.5 block">{step.location} • {step.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/account?tab=orders"
                className="bg-black text-white px-8 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#d3a95d] hover:text-black transition-colors rounded-xl shadow-lg"
              >
                Track Order in Account
              </Link>
              <Link
                href="/shop"
                className="bg-gray-100 text-gray-800 px-8 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-gray-200 transition-colors rounded-xl"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#faf9f6] pt-8 md:pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="mb-8 text-center md:text-left">
          <span className="text-xs uppercase tracking-widest text-[#d3a95d] font-bold">Checkout Process</span>
          <h1 className="text-3xl md:text-4xl font-serif text-black mt-1">Complete Your Order</h1>
        </div>

        {/* Multi-Step Indicator Bar */}
        <div className="mb-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-around">
          <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-[#d3a95d] font-bold' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${currentStep === 1 ? 'bg-[#d3a95d] text-white' : 'bg-gray-100'}`}>
              1
            </span>
            <span className="text-xs uppercase tracking-wider hidden sm:inline">1. Delivery Location</span>
          </div>

          <div className="w-12 h-px bg-gray-200"></div>

          <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-[#d3a95d] font-bold' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${currentStep === 2 ? 'bg-[#d3a95d] text-white' : 'bg-gray-100'}`}>
              2
            </span>
            <span className="text-xs uppercase tracking-wider hidden sm:inline">2. Payment Method</span>
          </div>

          <div className="w-12 h-px bg-gray-200"></div>

          <div className={`flex items-center gap-2 ${currentStep === 3 ? 'text-[#d3a95d] font-bold' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${currentStep === 3 ? 'bg-[#d3a95d] text-white' : 'bg-gray-100'}`}>
              3
            </span>
            <span className="text-xs uppercase tracking-wider hidden sm:inline">3. Confirmation</span>
          </div>
        </div>

        {/* Main Grid: Forms Left, Order Summary Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Column (Step 1 & Step 2 Forms) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: DELIVERY LOCATION */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-serif text-black">Delivery Location (Australia Only)</h2>
                    <p className="text-xs text-gray-500 mt-1">Select or add the address where you want your order delivered.</p>
                  </div>
                  <span className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Australia 🇦🇺
                  </span>
                </div>

                {addressError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                    {addressError}
                  </div>
                )}

                {/* Case: Customer has Saved Addresses */}
                {savedAddresses.length > 0 && !showAddAddressForm && (
                  <div className="space-y-4 mb-6">
                    <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">
                      Select Delivery Location ({savedAddresses.length} Available)
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                              isSelected
                                ? 'border-[#d3a95d] bg-[#faf6ed]/40 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="selectedAddress"
                                  checked={isSelected}
                                  onChange={() => setSelectedAddressId(addr.id)}
                                  className="w-4 h-4 text-[#d3a95d] focus:ring-[#d3a95d]"
                                />
                                <div>
                                  <span className="font-bold text-sm text-black">{addr.label}</span>
                                  {addr.isDefault && (
                                    <span className="ml-2 text-[10px] bg-black text-white px-2 py-0.5 rounded uppercase tracking-wider">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pl-7 text-xs text-gray-600 space-y-1">
                              <p className="font-semibold text-black">{addr.fullName} ({addr.phone})</p>
                              <p>{addr.street}</p>
                              <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                              <p className="text-gray-400 font-medium">Australia</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newName && user?.name) setNewName(user.name);
                        if (!newPhone && user?.phone) setNewPhone(user.phone);
                        setShowAddAddressForm(true);
                      }}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-xs uppercase tracking-wider font-bold text-gray-600 hover:border-black hover:text-black transition-colors mt-2"
                    >
                      + Add New Delivery Location
                    </button>
                  </div>
                )}

                {/* Case: Customer HAS NO ADDRESSES OR Clicked "+ Add New Location" */}
                {(savedAddresses.length === 0 || showAddAddressForm) && (
                  <form onSubmit={handleSaveNewAddress} className="space-y-4">
                    {savedAddresses.length > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs uppercase tracking-widest text-[#d3a95d] font-bold">New Location Form</span>
                        <button
                          type="button"
                          onClick={() => setShowAddAddressForm(false)}
                          className="text-xs text-gray-500 underline hover:text-black"
                        >
                          Cancel & Back to Saved Locations
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                          Location Title
                        </label>
                        <input
                          type="text"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="e.g. Home, Office, Sydney Villa"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Full recipient name"
                          autoComplete="name"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                          Australian Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+61 494 794 408"
                          inputMode="tel"
                          autoComplete="tel"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={newStreet}
                          onChange={(e) => setNewStreet(e.target.value)}
                          placeholder="e.g. 120 Collins St"
                          autoComplete="street-address"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                          Suburb / City
                        </label>
                        <input
                          type="text"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          placeholder="Sydney / Melbourne"
                          autoComplete="address-level2"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                          State
                        </label>
                        <select
                          value={newState}
                          onChange={(e) => setNewState(e.target.value)}
                          className={inputClass}
                        >
                          {AUSTRALIAN_STATES.map((st) => (
                            <option key={st} value={st} className="text-black bg-white">
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                          Postcode
                        </label>
                        <input
                          type="text"
                          value={newZip}
                          onChange={(e) => setNewZip(e.target.value)}
                          placeholder="2000"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-500 block mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value="Australia"
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base bg-gray-100 text-black font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#d3a95d] hover:text-black transition-colors rounded-xl shadow-lg mt-4"
                    >
                      Save Location
                    </button>
                  </form>
                )}

                {/* Continue to Step 2 Button */}
                {savedAddresses.length > 0 && !showAddAddressForm && (
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#d3a95d] hover:text-black transition-colors rounded-xl shadow-xl mt-6 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Payment Method</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </motion.div>
            )}

            {/* STEP 2: PAYMENT METHOD */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-serif text-black">Payment Method</h2>
                    <p className="text-xs text-gray-500 mt-1">Select your preferred payment option in Australia.</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-gray-400 hover:text-black underline font-medium"
                  >
                    Change Delivery Location
                  </button>
                </div>

                {paymentError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                    {paymentError}
                  </div>
                )}

                {/* Australia Payment Cards Reassurance */}
                <div className="bg-[#faf6ed] rounded-2xl p-4 mb-6 border border-[#e5d5b7] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#d3a95d]">
                    <svg className="w-5 h-5 text-[#d3a95d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-700">
                    <p className="font-bold text-black">Australian Single Gateway Integration</p>
                    <p className="text-[11px] text-gray-500">Visa, Mastercard, American Express & Apple Pay accepted natively.</p>
                  </div>
                </div>

                {/* Option 1: Saved Cards (if available) */}
                {savedCards.length > 0 && (
                  <div className="mb-4">
                    <div
                      onClick={() => setPaymentType('saved_card')}
                      className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
                        paymentType === 'saved_card' ? 'border-[#d3a95d] bg-[#faf6ed]/30' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentOption"
                            checked={paymentType === 'saved_card'}
                            onChange={() => setPaymentType('saved_card')}
                            className="w-4 h-4 text-[#d3a95d]"
                          />
                          <span className="font-bold text-sm text-black">Use Saved Card ({savedCards.length})</span>
                        </div>
                        <span className="text-xs text-[#b8860b] font-semibold">Fast Checkout</span>
                      </div>

                      {paymentType === 'saved_card' && (
                        <div className="mt-4 space-y-2 pl-7">
                          {savedCards.map((card) => (
                            <label
                              key={card.id}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                                selectedSavedCardId === card.id ? 'border-[#d3a95d] bg-white' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="savedCardItem"
                                  checked={selectedSavedCardId === card.id}
                                  onChange={() => setSelectedSavedCardId(card.id)}
                                  className="w-3.5 h-3.5 text-[#d3a95d]"
                                />
                                <span className="text-xs font-semibold text-black">{card.brand} {card.cardNumberMasked}</span>
                              </div>
                              <span className="text-xs text-gray-400">Exp {card.expiryDate}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Option 2: Apple Pay */}
                <div className="mb-4">
                  <div
                    onClick={() => setPaymentType('applepay')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
                      paymentType === 'applepay' ? 'border-[#d3a95d] bg-[#faf6ed]/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentType === 'applepay'}
                          onChange={() => setPaymentType('applepay')}
                          className="w-4 h-4 text-[#d3a95d]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-black">Apple Pay</span>
                          <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded"> Pay</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">1-Touch Express</span>
                    </div>

                    {paymentType === 'applepay' && (
                      <div className="mt-4 pl-7 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 bg-black text-white rounded-2xl border border-gray-800 shadow-inner">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold tracking-tight"> Pay</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ● Wallet Ready
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                            Confirm purchase instantly with Touch ID, Face ID, or your passcode via Apple Wallet.
                          </p>
                          <div className="bg-gray-900 rounded-xl p-3 mb-4 text-xs space-y-1.5 border border-gray-800">
                            <div className="flex justify-between text-gray-400">
                              <span>Merchant:</span>
                              <span className="text-white font-medium">{BRAND_CONFIG.name} Australia</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Payment Pass:</span>
                              <span className="text-white font-medium">Apple Pay (Default Card)</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handlePlaceOrder}
                            disabled={isProcessingOrder}
                            className="w-full bg-white text-black py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          >
                            {isProcessingOrder ? (
                              <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                <span>Authenticating Apple Pay...</span>
                              </>
                            ) : (
                              <>
                                <span className="text-base"></span>
                                <span>Pay with Apple Pay ({formatPrice(totalPrice)})</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                          <span>🛡️</span>
                          <span>Express encrypted transaction. Australia Secure Gateway tokenized.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 3: Credit / Debit Card (Visa, Mastercard, Amex) */}
                <div className="mb-6">
                  <div
                    onClick={() => setPaymentType('card')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
                      paymentType === 'card' ? 'border-[#d3a95d] bg-[#faf6ed]/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentType === 'card'}
                          onChange={() => setPaymentType('card')}
                          className="w-4 h-4 text-[#d3a95d]"
                        />
                        <span className="font-bold text-sm text-black">Credit / Debit Card</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="px-1.5 py-0.5 bg-blue-900 text-white rounded text-[10px]">VISA</span>
                        <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px]">MC</span>
                        <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[10px]">AMEX</span>
                      </div>
                    </div>

                    {paymentType === 'card' && (
                      <div className="mt-4 space-y-4 pl-7" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 block mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Name as it appears on card"
                            autoComplete="cc-name"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 block mb-1">
                            Card Number
                          </label>
                          {/*
                            `inputMode="numeric"` gives the number pad instead of a
                            full keyboard, and the `cc-*` autocomplete tokens are what
                            let a phone offer a saved or camera-scanned card at all.
                          */}
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4532 •••• •••• 4242"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            className={`${inputClass} tracking-widest font-mono`}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 block mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              className={`${inputClass} font-mono`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 block mb-1">
                              CVC Security Code
                            </label>
                            <input
                              type="text"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="123"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              className={`${inputClass} font-mono`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="saveCardCheck"
                            checked={saveCardForFuture}
                            onChange={(e) => setSaveCardForFuture(e.target.checked)}
                            className="w-4 h-4 text-[#d3a95d] rounded"
                          />
                          <label htmlFor="saveCardCheck" className="text-xs text-gray-600 cursor-pointer">
                            Save card securely for future purchases
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Place Order & Pay Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessingOrder}
                  className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#d3a95d] hover:text-black transition-colors rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  {isProcessingOrder ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Authorizing Australian Payment...</span>
                    </div>
                  ) : (
                    <span>CONFIRM &amp; PLACE ORDER ({formatPrice(totalPrice)})</span>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          {/* Right Column: Order Summary Box */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 sticky top-32">
              <h3 className="text-lg font-serif text-black mb-4">Order Summary</h3>

              {/* Items List */}
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto mb-6 pr-2">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center gap-4">
                    <div className="w-14 h-16 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                      <Image
                        src={item.product.images[0] || '/products/placeholder.webp'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-black truncate">{item.product.name}</p>
                      <p className="text-[11px] text-gray-500">Size: {item.selectedSize} • Qty: {item.quantity}</p>
                      <p className="text-xs font-serif font-bold text-[#d3a95d] mt-0.5">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Destination Badge */}
              <div className="bg-[#faf6ed] rounded-xl p-3 mb-6 flex items-center justify-between border border-[#e5d5b7]">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span>✈️</span>
                  <span className="font-semibold">Express Australia Shipping</span>
                </div>
                <span className="text-[10px] bg-[#d3a95d] text-white px-2 py-0.5 rounded font-bold uppercase">
                  FREE
                </span>
              </div>

              {/* Cost Calculations */}
              <div className="space-y-2 border-t border-gray-100 pt-4 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping (Australia Air Express)</span>
                  <span className="font-semibold text-[#b8860b]">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST / Import Taxes</span>
                  <span className="font-semibold">Included</span>
                </div>
                <div className="flex justify-between text-base font-serif text-black font-bold border-t border-gray-200 pt-3 mt-2">
                  <span>Total Amount</span>
                  <span className="text-[#d3a95d]">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
