import { create } from 'zustand';

/*
 * Mở/đóng modal "Đánh giá WoodHub" từ bất kỳ đâu (popup sau đặt hàng, footer, landing) — modal gắn 1 lần ở App.jsx.
 * `context` gửi lên BE để biết đánh giá đến từ đâu (after_order | footer | landing).
 * dismissedAfterOrder: khách bấm "Để sau" ở popup sau đặt hàng → không tự bật lại trong phiên này (không persist:
 * phiên sau đặt đơn mới vẫn được mời lại cho tới khi đánh giá).
 */
export const useFeedbackStore = create((set) => ({
  open: false,
  context: 'footer',
  dismissedAfterOrder: false,
  openFeedback: (context = 'footer') => set({ open: true, context }),
  close: () => set((s) => ({ open: false, dismissedAfterOrder: s.dismissedAfterOrder || s.context === 'after_order' })),
}));
