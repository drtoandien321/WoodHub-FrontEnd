import { create } from 'zustand';
import { WOOD_MATERIALS, FINISH_COLORS, PRODUCT_TYPE_DEFAULTS } from '../api/mock/customData.js';

/*
 * Store riêng cho Configurator 3D (tách khỏi cart/auth) vì:
 * - Rất nhiều giá trị liên quan nhau (size ↔ giá ↔ mô hình 3D ↔ bảng thông số)
 * - Gom 1 chỗ → mô hình 3D, PricePanel, SpecPanel cùng "lắng nghe" 1 nguồn sự thật
 * - Sau này dễ thêm undo/redo (chỉ cần snapshot store)
 *
 * MVP scope đúng theo FE Plan: CHỈ kích thước + chất liệu + màu.
 */
export const useConfiguratorStore = create((set, get) => ({
  productType: null, // 'table' | 'cabinet' | 'shelf' | 'chair'
  dimensions: { width: 120, height: 75, depth: 60 }, // cm
  materialId: 'oak',
  finishId: 'natural',

  initForType: (type) => {
    const defaults = PRODUCT_TYPE_DEFAULTS[type] ?? PRODUCT_TYPE_DEFAULTS.table;
    set({ productType: type, dimensions: { ...defaults.dimensions }, materialId: 'oak', finishId: 'natural' });
  },

  setDimension: (key, value) =>
    set((state) => ({ dimensions: { ...state.dimensions, [key]: value } })),

  setMaterial: (materialId) => set({ materialId }),
  setFinish: (finishId) => set({ finishId }),

  /*
   * Giá ước tính tính ở FE chỉ để hiển thị real-time (không gọi API mỗi lần kéo slider).
   * Giá CHÍNH THỨC phải do BE tính lại khi lưu thiết kế (POST /custom/designs)
   * — không bao giờ tin giá từ client.
   * Công thức demo: thể tích (m³) × đơn giá vật liệu × hệ số hoàn thiện.
   */
  estimatePrice: () => {
    const { dimensions, materialId, finishId } = get();
    const volumeM3 = (dimensions.width * dimensions.height * dimensions.depth) / 1_000_000;
    const material = WOOD_MATERIALS.find((m) => m.id === materialId);
    const finish = FINISH_COLORS.find((f) => f.id === finishId);
    const base = volumeM3 * (material?.pricePerM3 ?? 8_000_000);
    return Math.round((base * (finish?.priceFactor ?? 1) + 500_000) / 10_000) * 10_000;
  },
}));
