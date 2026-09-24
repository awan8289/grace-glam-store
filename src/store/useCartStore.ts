import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, selectedSize: string, selectedColor: string, quantity?: number) => void;
  removeItem: (productId: string, selectedSize: string, selectedColor: string) => void;
  updateQuantity: (productId: string, selectedSize: string, selectedColor: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, selectedSize, selectedColor, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += quantity;
            return { items: updatedItems, isOpen: true };
          }

          return {
            items: [...state.items, { product, selectedSize, selectedColor, quantity }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, selectedSize, selectedColor) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor
              )
          ),
        }));
      },

      updateQuantity: (productId, selectedSize, selectedColor, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) =>
                  !(
                    item.product.id === productId &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor
                  )
              ),
            };
          }

          return {
            items: state.items.map((item) => {
              if (
                item.product.id === productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor
              ) {
                return { ...item, quantity };
              }
              return item;
            }),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },
    }),
    {
      name: 'aura-maison-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
