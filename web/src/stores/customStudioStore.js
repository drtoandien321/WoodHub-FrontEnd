import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultConfiguration } from '../utils/modelOptions.js';

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

const initialTransient = {
  step: 1,
  source: null, // 'upload' | 'template' | 'text'
  imageFile: null,
  imagePreviewUrl: null,
  productType: null,
  removeBackground: false,
  model: null, // Model3dResponse hiện tại (từ template hoặc từ task 'succeeded') — hiển thị ở bước 4+
  configuration: { material: null, color: null, dimensions: null },
  // Mô tả cho text-to-3D (bước 2 khi source='text') — khớp body POST /custom/ai/generate/text
  textInput: { prompt: '', artStyle: 'realistic', negativePrompt: '' },
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
      ownerId: null, // id user sở hữu wizard đang lưu — services/accountScope.js reset khi đổi tài khoản

      goToStep: (step) => set({ step }),
      setOwner: (ownerId) => set({ ownerId }),

      /*
       * chooseUpload/chooseTemplate = "chọn nguồn MỚI" — luôn xoá designId/designVersion đang giữ
       * (nếu có, từ 1 lượt chọn trước đó ở cùng phiên wizard). Không xoá thì bước 6 "Lưu" sẽ PUT
       * đè lên draft CŨ (gắn với model cũ) thay vì tạo thiết kế mới cho model vừa chọn lại.
       */
      chooseUpload: () => set({ source: 'upload', step: 2, designId: null, designVersion: null, designName: '' }),

      // Text-to-3D: khách tự MÔ TẢ món đồ bằng chữ → bước 2 là form mô tả (thay cho chuẩn bị ảnh)
      chooseText: () => set({ source: 'text', step: 2, taskId: null, designId: null, designVersion: null, designName: '' }),
      setTextInput: (patch) => set((s) => ({ textInput: { ...s.textInput, ...patch } })),

      /*
       * Bấm "Nâng cấp texture" ở bước 4: task quay lại processing → về bước 3 theo dõi, bỏ model đang
       * xem (bản preview) để khi task succeeded lần nữa wizard tải lại model ĐÃ có texture.
       */
      startRefine: () => set({ model: null, step: 3 }),

      // Chọn mẫu có sẵn từ thư viện — có model ngay, bỏ qua bước 2/3 (không cần generate)
      chooseTemplate: (model) =>
        set({
          source: 'template', model, selectedTemplateSlug: model.slug, taskId: null, step: 4,
          configuration: defaultConfiguration(model), designId: null, designVersion: null, designName: '',
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
      setGeneratedModel: (model) => set({ model, step: 4, configuration: defaultConfiguration(model) }),

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
        step: s.step, source: s.source, taskId: s.taskId, selectedTemplateSlug: s.selectedTemplateSlug, textInput: s.textInput,
        productType: s.productType, ownerId: s.ownerId, designId: s.designId, designVersion: s.designVersion, designName: s.designName,
      }),
    }
  )
);
