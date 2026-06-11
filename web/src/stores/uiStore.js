import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/*
 * UI store — quản lý theme sáng/tối, áp dụng cho toàn app qua document.documentElement.dataset.theme
 * (xem App.jsx). persist: lưu lựa chọn vào localStorage để F5 không mất.
 */
export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: 'woodhub', // 'woodhub' | 'woodhub-dark' — tên theme khai báo trong index.css
      toggleTheme: () => set({ theme: get().theme === 'woodhub' ? 'woodhub-dark' : 'woodhub' }),
    }),
    { name: 'woodhub-ui' }
  )
);
