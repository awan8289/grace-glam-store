import { BrandConfig } from '@/types';

export const BRAND_CONFIG: BrandConfig = {
  name: 'GRACE & GLAM',
  tagline: 'Bespoke Keepsakes & Personalized Jewelry',
  country: 'Australia',
  currency: 'AUD',
  currencySymbol: 'A$',
};

export const CONTACT_INFO = {
  email: 'graceandglame.au@gmail.com',
  phone: '+61494794408',
  phoneDisplay: '+61 494 794 408',
  whatsappUrl: 'https://wa.me/61494794408',
  instagramUrl: 'https://www.instagram.com/graceandglam.au',
  facebookUrl: 'https://www.facebook.com/graceandglam.au/',
  location: 'Australia',
};

export const REVALIDATE_INTERVAL = {
  HOME: 3600, // 1 hour ISR
  PRODUCTS: 1800, // 30 mins ISR
  PRODUCT_DETAIL: 900, // 15 mins ISR
  COLLECTIONS: 3600,
};

// Every entry must resolve to a real route
export const NAV_LINKS = [
  { name: 'Shop All', href: '/shop' },
  { name: 'Name Necklaces', href: '/shop?category=Personalised%20Necklaces' },
  { name: 'Pet Diamond Art', href: '/shop?category=Pet%20Diamond%20Paintings' },
  { name: 'The Maison', href: '/maison' },
  { name: 'Bespoke Atelier', href: '/atelier' },
];
