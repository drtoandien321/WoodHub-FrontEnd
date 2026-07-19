import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/*
 * Store cho Custom Studio wizard (FE-2, 6 bước — xem pages/CustomStudio.jsx).
 * CHỈ giữ state điều hướng/lựa chọn của FE (client state) — dữ liệu model/design thật lấy qua
 * React Query (hooks/useModels3d.js, useCustomDesigns.js), KHÔNG trộn 2 nguồn.
 *
 * persist CHỌN LỌC (partialize) — chỉ vài con trỏ nhỏ, KHÔNG persist File/object model đầy đủ:
 *   - taskId: để bước 3 tự resume poll khi user rời trang rồi quay lại (yêu cầu FE-2 bước 3).
 *   - selectedTemplateSlug: để bước 4+ tự fetch lại model khi chọn từ thư viện (không cần generate).
 *   - designId/designVersion: để bước 5/6 tiếp tục sửa đúng bản draft đang có (optimistic lock).
 * Component tự dùng các con trỏ này để refetch qua React Query khi mount lại — store không tự gọi API.
 */
// Cấu hình mặc định khi vừa có model — mỗi chiều lấy TRUNG ĐIỂM khoảng hợp lệ BE cho phép
// (editableOptions.dimensions), không có key nào thì để null (bước 5 sẽ không render control đó).
const midpoint = ([min, max]) => Math.round((min + max) / 2);
const defaultConfigFor = (model) => {
  const opt = model?.editableOptions ?? {};
  const dims = opt.dimensions;
  return {
    material: opt.materials?.[0] ?? null,
    color: opt.colors?.[0] ?? null,
    dimensions: dims ? { width: midpoint(dims.width ?? [0, 0]), height: midpoint(dims.height ?? [0, 0]), depth: midpoint(dims.depth ?? [0, 0]) } : null,
  };
};

const initialTransient = {
  step: 1,
  source: null, // 'upload' | 'template'
  imageFile: null,
  imagePreviewUrl: null,
  productType: null,
  removeBackground: false,
  model: null, // Model3dResponse hiện tại (từ template hoặc từ task 'succeeded') — hiển thị ở bước 4+
  configuration: { material: null, color: null, dimensions: null },
};

export const useCustomStudioStore = create(
  persist(
    (set, get) => ({
      ...initialTransient,
      taskId: null,
      selectedTemplateSlug: null,
      designId: null,
      designVersion: null,
      designName: '',

      goToStep: (step) => set({ step }),

      /*
       * chooseUpload/chooseTemplate = "chọn nguồn MỚI" — luôn xoá designId/designVersion đang giữ
       * (nếu có, từ 1 lượt chọn trước đó ở cùng phiên wizard). Không xoá thì bước 6 "Lưu" sẽ PUT
       * đè lên draft CŨ (gắn với model cũ) thay vì tạo thiết kế mới cho model vừa chọn lại.
       */
      chooseUpload: () => set({ source: 'upload', step: 2, designId: null, designVersion: null, designName: '' }),

      // Chọn mẫu có sẵn từ thư viện — có model ngay, bỏ qua bước 2/3 (không cần generate)
      chooseTemplate: (model) =>
        set({
          source: 'template', model, selectedTemplateSlug: model.slug, taskId: null, step: 4,
          configuration: defaultConfigFor(model), designId: null, designVersion: null, designName: '',
        }),

      setImageFile: (file, previewUrl) => {
        const prev = get().imagePreviewUrl;
        if (prev) URL.revokeObjectURL(prev);
        set({ imageFile: file, imagePreviewUrl: previewUrl });
      },
      clearImage: () => {
        const prev = get().imagePreviewUrl;
        if (prev) URL.revokeObjectURL(prev);
        set({ imageFile: null, imagePreviewUrl: null });
      },

      setProductType: (productType) => set({ productType }),
      setRemoveBackground: (removeBackground) => set({ removeBackground }),

      // Vừa tạo task generate xong → sang bước 3 theo dõi tiến trình
      startTask: (taskId) => set({ taskId, step: 3 }),

      // Task 'succeeded' hoặc chọn mẫu xong → có model để xem/chỉnh ở bước 4/5
      setGeneratedModel: (model) => set({ model, step: 4, configuration: defaultConfigFor(model) }),

      // Hủy/thử lại từ đầu ở bước 3 (KHÔNG xoá lựa chọn nguồn/ảnh — user có thể muốn thử ảnh khác)
      clearTask: () => set({ taskId: null }),

      setConfiguration: (patch) => set((s) => ({ configuration: { ...s.configuration, ...patch } })),
      setDesignName: (designName) => set({ designName }),
      setDesignMeta: ({ id, version }) => set({ designId: id, designVersion: version }),

      // Bắt đầu thiết kế mới hoàn toàn (nút "Thiết kế mới" / sau khi lưu xong)
      reset: () => {
        const prev = get().imagePreviewUrl;
        if (prev) URL.revokeObjectURL(prev);
        set({ ...initialTransient, taskId: null, selectedTemplateSlug: null, designId: null, designVersion: null, designName: '' });
      },
    }),
    {
      name: 'woodhub-custom-studio',
      partialize: (s) => ({
        step: s.step, source: s.source, taskId: s.taskId, selectedTemplateSlug: s.selectedTemplateSlug,
        productType: s.productType, designId: s.designId, designVersion: s.designVersion, designName: s.designName,
      }),
    }
  )
);
