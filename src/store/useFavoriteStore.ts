import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatPrice } from '@/lib/format';

export interface FavoriteItem {
  id: string;
  name: string;
  price: string;
  numericPrice: number;
  image: string;
  category: string;
}

export function formatFavItem(prod: {
  id: string | number;
  name: string;
  price: string | number;
  image?: string;
  images?: string[];
  category?: string;
}): FavoriteItem {
  const numericPrice = typeof prod.price === 'number'
    ? prod.price
    : (parseFloat(String(prod.price).replace(/[^0-9.]/g, '')) || 0);

  return {
    id: String(prod.id),
    name: prod.name,
    price: formatPrice(numericPrice),
    numericPrice,
    image: prod.image || (prod.images && prod.images[0]) || '/products/placeholder.webp',
    category: prod.category || 'Luxury',
  };
}

interface FavoriteStore {
  items: FavoriteItem[];
  isOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavoritesDrawer: () => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string | number) => boolean;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      // Starts empty — the wishlist belongs to the shopper, not the seed data.
      items: [],
      isOpen: false,

      openFavorites: () => set({ isOpen: true }),
      closeFavorites: () => set({ isOpen: false }),
      toggleFavoritesDrawer: () => set((state) => ({ isOpen: !state.isOpen })),

      addFavorite: (item) => {
        set((state) => {
          const exists = state.items.some((fav) => String(fav.id) === String(item.id));
          if (exists) {
            return { isOpen: true };
          }
          return {
            items: [...state.items, item],
            isOpen: true,
          };
        });
      },

      removeFavorite: (id) => {
        set((state) => ({
          items: state.items.filter((fav) => String(fav.id) !== String(id)),
        }));
      },

      toggleFavorite: (item) => {
        const isFav = get().isFavorite(item.id);
        if (isFav) {
          get().removeFavorite(String(item.id));
        } else {
          get().addFavorite(item);
        }
      },

      isFavorite: (id) => {
        return get().items.some((fav) => String(fav.id) === String(id));
      },
    }),
    {
      name: 'aura-maison-favorites-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
