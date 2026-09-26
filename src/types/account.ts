// ============================================================================
// Customer accounts and orders — shared by the storefront, the APIs and admin.
// ============================================================================

export interface Address {
  id: string;
  /** e.g. "Home", "Work", "Sydney Villa" */
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault?: boolean;
}

/**
 * A card on file. Only ever holds a masked number, brand and expiry — the full
 * number and CVC are used in the browser to derive the last four and are never
 * transmitted or stored.
 */
export interface SavedCard {
  id: string;
  cardholderName: string;
  /** e.g. "•••• •••• •••• 4242" */
  cardNumberMasked: string;
  expiryDate: string;
  brand: 'Visa' | 'Mastercard' | 'Amex' | 'ApplePay';
  isDefault?: boolean;
}

/** Stored shape, including the password hash. Never leaves the server. */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  /** Initials fallback shown when there is no picture. */
  avatar: string;
  avatarUrl?: string;
  /**
   * Absent for accounts created through Google — there is no password to hash.
   * Password sign-in simply never succeeds for those; see `authenticateCustomer`.
   */
  passwordHash?: string;
  /** Google's stable subject id, set once the account is linked. */
  googleId?: string;
  addresses: Address[];
  savedCards: SavedCard[];
  /** Loyalty label shown on the account dashboard. */
  membershipTier?: 'Silver Classic' | 'Gold VIP' | 'Platinum Couture';
  rewardPoints?: number;
  createdAt: string;
  updatedAt: string;
}

/** What the API returns — the stored shape minus the password hash. */
export type PublicCustomer = Omit<Customer, 'passwordHash'>;

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  'Processing',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses that still need work from the merchant. */
export const OPEN_STATUSES: OrderStatus[] = ['Processing', 'In Transit', 'Out for Delivery'];

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  /** Formatted for display, e.g. "A$420.00". */
  price: string;
  unitPrice: number;
  quantity: number;
  image: string;
  size: string;
  color: string;
  /** Custom engraved or inscribed text (e.g. name for custom necklace) */
  customText?: string;
}

/**
 * The delivery address exactly as the shopper entered it, copied onto the order
 * at the moment it was placed.
 *
 * A snapshot, not a reference: editing an address in the account must never
 * rewrite where an already-dispatched parcel was sent. `Order.shippingAddress`
 * keeps the same information as one flattened line, but a courier needs the
 * recipient's name and phone as separate fields — and those were never in it.
 */
export interface ShippingDetails {
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface TrackingStep {
  title: string;
  description: string;
  timestamp: string;
  location: string;
  status: 'completed' | 'current' | 'pending';
}

export interface Order {
  id: string;
  customerId: string;
  /** Denormalised so the admin list needs no customer lookup. */
  customerName: string;
  customerEmail: string;
  date: string;
  total: string;
  subtotal: number;
  status: OrderStatus;
  paymentMethod: string;
  /** One flattened line. Kept for orders placed before `shippingDetails`. */
  shippingAddress: string;
  /** Optional because orders placed before this field existed will not have it. */
  shippingDetails?: ShippingDetails;
  destinationCountry: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  items: OrderItem[];
  trackingSteps: TrackingStep[];
  /** True once stock has been returned by a cancellation. */
  stockRestored?: boolean;
  /** Consolidated custom text for custom items in this order */
  customText?: string;
  createdAt: string;
  updatedAt: string;
}
