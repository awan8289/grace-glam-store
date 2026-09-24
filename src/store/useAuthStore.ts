import { create } from 'zustand';
import { Address, Order, PublicCustomer, SavedCard } from '@/types/account';

// Re-exported so existing imports from this module keep working.
export type { Address, Order, OrderItem, SavedCard, TrackingStep } from '@/types/account';
export type AuthUser = PublicCustomer;

interface AuthState {
  user: PublicCustomer | null;
  orders: Order[];
  isLoggedIn: boolean;
  /** False until the first `/api/account/me` call settles. */
  isReady: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';

  // Session
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (profile?: {
    email?: string;
    name?: string;
    avatarUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Modal
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  requireAuth: (onSuccess: () => void) => void;

  // Profile
  updateProfile: (data: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  saveAddresses: (addresses: Address[]) => Promise<void>;
  saveCards: (cards: SavedCard[]) => Promise<void>;

  // Convenience wrappers — the server stores the address book and card list as
  // whole sets, these just compute the next set and save it.
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addSavedCard: (card: Omit<SavedCard, 'id'>) => Promise<void>;
  deleteSavedCard: (id: string) => Promise<void>;
  setDefaultCard: (id: string) => Promise<void>;
}

let pendingCallback: (() => void) | null = null;

/**
 * Session state only. Accounts and orders live on the server
 * (`data/customers.json`, `data/orders.json`) behind an httpOnly cookie — this
 * store just mirrors the current session so the UI can react to it.
 *
 * It is deliberately NOT persisted: the cookie is the source of truth, and
 * persisting a copy would let a stale user survive a sign-out in another tab.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  orders: [],
  isLoggedIn: false,
  isReady: false,
  isAuthModalOpen: false,
  authModalMode: 'login',

  refresh: async () => {
    try {
      const response = await fetch('/api/account/me');
      if (!response.ok) {
        set({ user: null, orders: [], isLoggedIn: false, isReady: true });
        return;
      }
      const { customer, orders } = await response.json();
      set({ user: customer, orders: orders ?? [], isLoggedIn: true, isReady: true });
    } catch {
      set({ user: null, orders: [], isLoggedIn: false, isReady: true });
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();

      if (!response.ok) return { success: false, error: body.error ?? 'Sign in failed.' };

      await get().refresh();

      pendingCallback?.();
      pendingCallback = null;
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Please try again.' };
    }
  },

  signup: async (name, email, password) => {
    try {
      const response = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await response.json();

      if (!response.ok) return { success: false, error: body.error ?? 'Sign up failed.' };

      await get().refresh();

      pendingCallback?.();
      pendingCallback = null;
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Please try again.' };
    }
  },

  loginWithGoogle: async (profile) => {
    try {
      const response = await fetch('/api/account/google/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile ?? {}),
      });
      const body = await response.json();

      if (!response.ok) return { success: false, error: body.error ?? 'Google sign in failed.' };

      await get().refresh();

      pendingCallback?.();
      pendingCallback = null;
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Please try again.' };
    }
  },

  logout: async () => {
    await fetch('/api/account/logout', { method: 'POST' }).catch(() => undefined);
    set({ user: null, orders: [], isLoggedIn: false });
  },

  openAuthModal: (mode = 'login') => set({ isAuthModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  requireAuth: (onSuccess) => {
    if (get().isLoggedIn) {
      onSuccess();
      return;
    }
    pendingCallback = onSuccess;
    set({ isAuthModalOpen: true, authModalMode: 'login' });
  },

  updateProfile: async (data) => {
    const response = await fetch('/api/account/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const { customer } = await response.json();
      set({ user: customer });
    }
  },

  saveAddresses: async (addresses) => {
    const response = await fetch('/api/account/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses }),
    });
    if (response.ok) {
      const { customer } = await response.json();
      set({ user: customer });
    }
  },

  saveCards: async (savedCards) => {
    const response = await fetch('/api/account/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedCards }),
    });
    if (response.ok) {
      const { customer } = await response.json();
      set({ user: customer });
    }
  },

  // --- Address book -------------------------------------------------------

  addAddress: async (address) => {
    const current = get().user?.addresses ?? [];
    // The server assigns the real id; an empty one marks it as new.
    await get().saveAddresses([...current, { ...address, id: '' }]);
  },

  deleteAddress: async (id) => {
    const current = get().user?.addresses ?? [];
    await get().saveAddresses(current.filter((address) => address.id !== id));
  },

  setDefaultAddress: async (id) => {
    const current = get().user?.addresses ?? [];
    await get().saveAddresses(
      current.map((address) => ({ ...address, isDefault: address.id === id }))
    );
  },

  // --- Saved cards --------------------------------------------------------

  addSavedCard: async (card) => {
    const current = get().user?.savedCards ?? [];
    await get().saveCards([...current, { ...card, id: '' }]);
  },

  deleteSavedCard: async (id) => {
    const current = get().user?.savedCards ?? [];
    await get().saveCards(current.filter((card) => card.id !== id));
  },

  setDefaultCard: async (id) => {
    const current = get().user?.savedCards ?? [];
    await get().saveCards(current.map((card) => ({ ...card, isDefault: card.id === id })));
  },
}));
