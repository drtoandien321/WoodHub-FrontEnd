import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/*
 * locationStore — vị trí CUSTOMER đã chia sẻ (khác StoreMapPicker — đó là supplier tự đặt ghim
 * cho chi nhánh). Dùng chung cho Checkout (Pha 3) + Custom order (Pha 4), không phải xin lại
 * quyền mỗi trang. `persist` để F5 không mất — quan trọng nhất là nhớ trạng thái `denied` để
 * KHÔNG bao giờ tự động hỏi lại (trình duyệt cũng chặn hỏi lại lập trình được, nhưng tự mình
 * cũng phải tôn trọng, không nên cứ gọi lại getCurrentPosition liên tục làm phiền).
 *
 * permission: 'granted' | 'denied' | 'unsupported' | 'error' | null (chưa từng hỏi).
 */
export const useLocationStore = create(
  persist(
    (set) => ({
      coords: null, // { latitude, longitude } | null
      permission: null,
      setCoords: (latitude, longitude) => set({ coords: { latitude, longitude }, permission: 'granted' }),
      setPermission: (permission) => set({ permission }),
    }),
    { name: 'woodhub-location' }
  )
);
