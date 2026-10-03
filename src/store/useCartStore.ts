import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

export interface AddItemOptions {
  customText?: string;
  secondaryCustomText?: string;
  customImage?: string;
  script?: 'English' | 'Arabic';
  chainLength?: string;
  giftBox?: boolean;
  isBundle?: boolean;
  customPrice?: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    product: Product,
    selectedSize: string,
    selectedColor: string,
    quantity?: number,
    options?: AddItemOptions
  ) => void;
  removeItem: (
    productId: string,
    selectedSize: string,
    selectedColor: string,
    customText?: string,
    giftBox?: boolean
  ) => void;
  updateQuantity: (
    productId: string,
    selectedSize: string,
    selectedColor: string,
    quantity: number,
    customText?: string,
    giftBox?: boolean
  ) => void;
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

      addItem: (product, selectedSize, selectedColor, quantity = 1, options = {}) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor &&
              item.customText === options.customText &&
              item.secondaryCustomText === options.secondaryCustomText &&
              item.customImage === options.customImage &&
              Boolean(item.giftBox) === Boolean(options.giftBox)
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += quantity;
            return { items: updatedItems, isOpen: true };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                selectedSize,
                selectedColor,
                quantity,
                customText: options.customText,
                secondaryCustomText: options.secondaryCustomText,
                customImage: options.customImage,
                script: options.script,
                chainLength: options.chainLength,
                giftBox: options.giftBox,
                isBundle: options.isBundle,
                customPrice: options.customPrice,
              },
            ],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, selectedSize, selectedColor, customText, giftBox) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor &&
                (customText === undefined || item.customText === customText) &&
                (giftBox === undefined || Boolean(item.giftBox) === Boolean(giftBox))
              )
          ),
        }));
      },

      updateQuantity: (productId, selectedSize, selectedColor, quantity, customText, giftBox) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) =>
                  !(
                    item.product.id === productId &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor &&
                    (customText === undefined || item.customText === customText) &&
                    (giftBox === undefined || Boolean(item.giftBox) === Boolean(giftBox))
                  )
              ),
            };
          }

          return {
            items: state.items.map((item) => {
              if (
                item.product.id === productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor &&
                (customText === undefined || item.customText === customText) &&
                (giftBox === undefined || Boolean(item.giftBox) === Boolean(giftBox))
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
        return get().items.reduce((sum, item) => {
          const basePrice = item.customPrice ?? item.product.price;
          const giftBoxPrice = item.giftBox ? 9.95 : 0;
          return sum + (basePrice + giftBoxPrice) * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'aura-maison-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
