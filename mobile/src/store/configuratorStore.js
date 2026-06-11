import { create } from 'zustand';
import { WOOD_MATERIALS, FINISH_COLORS } from '../api/mockData.js';

// Mirror configuratorStore của web — cùng công thức giá để 2 nền tảng khớp nhau
const DEFAULTS = {
  table: { width: 140, height: 75, depth: 70 },
  cabinet: { width: 120, height: 200, depth: 55 },
  shelf: { width: 80, height: 180, depth: 30 },
  chair: { width: 45, height: 90, depth: 50 },
};

export const LIMITS = {
  table: { width: [60, 240], height: [40, 110], depth: [40, 120] },
  cabinet: { width: [60, 300], height: [80, 260], depth: [35, 70] },
  shelf: { width: [40, 200], height: [60, 240], depth: [20, 45] },
  chair: { width: [35, 70], height: [70, 110], depth: [40, 60] },
};

export const useConfiguratorStore = create((set, get) => ({
  productType: 'table',
  dimensions: { ...DEFAULTS.table },
  materialId: 'oak',
  finishId: 'natural',
  initForType: (type) => set({ productType: type, dimensions: { ...(DEFAULTS[type] ?? DEFAULTS.table) }, materialId: 'oak', finishId: 'natural' }),
  setDimension: (key, value) => set((s) => ({ dimensions: { ...s.dimensions, [key]: value } })),
  setMaterial: (materialId) => set({ materialId }),
  setFinish: (finishId) => set({ finishId }),
  estimatePrice: () => {
    const { dimensions, materialId, finishId } = get();
    const volumeM3 = (dimensions.width * dimensions.height * dimensions.depth) / 1000000;
    const material = WOOD_MATERIALS.find((m) => m.id === materialId);
    const finish = FINISH_COLORS.find((f) => f.id === finishId);
    return Math.round((volumeM3 * (material?.pricePerM3 ?? 8000000) * (finish?.priceFactor ?? 1) + 500000) / 10000) * 10000;
  },
}));
