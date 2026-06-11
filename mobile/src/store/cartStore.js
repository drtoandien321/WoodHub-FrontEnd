import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * Cùng API với cartStore của web — khác duy nhất storage engine:
 * web dùng localStorage, RN không có localStorage nên dùng AsyncStorage.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing)
            return { items: state.items.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + qty } : i)) };
          return { items: [...state.items, { productId: product.id, name: product.name, price: product.price, color: product.color, qty }] };
        }),
      updateQty: (productId, qty) =>
        set((state) => ({
          items: qty <= 0 ? state.items.filter((i) => i.productId !== productId) : state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        })),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
    }),
    { name: 'woodhub-cart', storage: createJSONStorage(() => AsyncStorage) }
  )
);
