import { create } from 'zustand';
import { defaultConfig, basePriceFor } from '../utils/woods.js';

/*
 * Studio store — trạng thái của luồng "Thiết kế": mô hình đang xem, cấu hình tuỳ chỉnh (màu/chất liệu/kích thước),
 * ảnh người dùng chọn, tác vụ AI dựng 3D và bản thiết kế đã lưu. Chỉ giữ trong bộ nhớ (không persist): thiết kế
 * đã lưu nằm trên BE (GET /custom/designs/my), tác vụ AI dở dang lấy lại qua taskId đang theo dõi.
 */
export const useStudio = create((set, get) => ({
  model: null, // Model3dResponse
  mode: 'template', // 'template' | 'product' | 'result'
  cfg0: null, cfg: null, base: 4200000, productName: null,
  photo: null, removeBg: true, taskId: null,
  designId: null, designVersion: null, designName: '', savedDesign: null,

  // Mở một mô hình để xem/chỉnh. `base` = giá gốc tham khảo (giá sản phẩm nếu có).
  openModel: (model, { mode = 'template', base, productName = null } = {}) => {
    const c = defaultConfig(model);
    set({
      model, mode, cfg0: c, cfg: { ...c }, base: base || basePriceFor(model?.productType), productName,
      designId: null, designVersion: null, designName: model?.name || '', savedDesign: null,
    });
  },
  setCfg: (patch) => set((s) => ({ cfg: { ...s.cfg, ...patch } })),
  resetCfg: () => set((s) => ({ cfg: s.cfg0 ? { ...s.cfg0 } : s.cfg })),

  setPhoto: (photo) => set({ photo }),
  setRemoveBg: (removeBg) => set({ removeBg }),
  setTaskId: (taskId) => set({ taskId }),
  setDesignName: (designName) => set({ designName }),
  setDesignMeta: ({ id, version }) => set({ designId: id, designVersion: version }),
  setSaved: (savedDesign) => set({ savedDesign }),
  reset: () => set({ model: null, mode: 'template', cfg0: null, cfg: null, photo: null, taskId: null, designId: null, designVersion: null, designName: '', savedDesign: null, productName: null }),
}));
