import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/*
 * Giỏ hàng guest lưu local (persist). Khi login, BE cần endpoint merge giỏ:
 * POST /cart/merge — xem API_CONTRACT.md. MVP: chỉ dùng local.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { productId, name, price, image, qty }

      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { productId: product.id, name: product.name, price: product.price, image: product.image, qty },
            ],
          };
        }),

      updateQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        })),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),

      // selector tiện dụng — gọi useCartStore.getState().subtotal()
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: 'woodhub-cart' }
  )
);
