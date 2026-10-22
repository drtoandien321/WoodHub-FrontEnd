import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho nhánh AI 3D (thư viện mẫu / sinh model từ ảnh — BE-1→BE-4).
 * TERMINAL_STATUSES: 3 trạng thái BE đã kết thúc xử lý — useGenTask PHẢI dừng poll ở cả 3,
 * không chỉ 'succeeded' (bug cũ: task 'failed'/'cancelled' bị poll vô hạn mỗi 1.5s).
 */
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled']);

export const useModels3d = (params) =>
  useQuery({ queryKey: ['models3d', params], queryFn: () => api.getModels3d(params) });

export const useModel3d = (slug) =>
  useQuery({ queryKey: ['model3d', slug], queryFn: () => api.getModel3d(slug), enabled: !!slug, retry: false });

export const useGenerate3D = () => useMutation({ mutationFn: api.generate3D });

// Text-to-3D (bước preview) — cùng shape kết quả { taskId } với generate từ ảnh
export const useGenerate3DFromText = () => useMutation({ mutationFn: api.generate3DFromText });

/*
 * Nâng cấp texture (refine) cho task text-to-3D. BE cập nhật CHÍNH model preview (giữ nguyên slug) →
 * phải XOÁ cache ['model3d', slug] cũ, nếu không React Query vẫn trả bản preview chưa texture khi
 * wizard tải lại model sau khi refine xong. Ghi luôn task mới (processing) vào cache để poll tiếp ngay.
 */
export const useRefineGenTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }) => api.refineGenTask(taskId),
    onSuccess: (task, { modelSlug }) => {
      queryClient.setQueryData(['genTask', task.taskId], task);
      if (modelSlug) queryClient.removeQueries({ queryKey: ['model3d', modelSlug] });
    },
  });
};

/*
 * Poll GET /custom/ai/tasks/:taskId mỗi 2s (trong khoảng khuyến nghị 1.5-3s) tới khi đạt
 * TERMINAL_STATUSES thì tự dừng (refetchInterval trả false). enabled: !!taskId — không gọi
 * endpoint task khi chưa có taskId (vd trước khi generate xong).
 */
export const useGenTask = (taskId) =>
  useQuery({
    queryKey: ['genTask', taskId],
    queryFn: () => api.getGenTask(taskId),
    enabled: !!taskId,
    retry: false,
    refetchInterval: (query) => (TERMINAL_STATUSES.has(query.state.data?.status) ? false : 2000),
  });

// GET /custom/ai/tasks/my — để wizard tự resume task đang chạy khi user quay lại trang (FE-2 bước 3)
export const useMyGenTasks = (params) =>
  useQuery({ queryKey: ['myGenTasks', params], queryFn: () => api.getMyGenTasks(params) });

export const useRetryGenTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.retryGenTask,
    onSuccess: (task) => queryClient.setQueryData(['genTask', task.taskId], task),
  });
};

export const useCancelGenTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelGenTask,
    onSuccess: (task) => queryClient.setQueryData(['genTask', task.taskId], task),
  });
};

// Thư viện model AI của tôi (GET /custom/models/my) + đổi tên (PUT /custom/models/:id)
export const useMyModels = (params) =>
  useQuery({ queryKey: ['myModels', params], queryFn: () => api.getMyModels(params) });

export const useRenameModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.renameModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myModels'] }),
  });
};

// ----- Admin thư viện mẫu 3D (BE-04) + gắn model cho sản phẩm -----
const ADMIN_MODELS_KEY = ['adminModels3d'];
export const useAdminModels3d = (params) =>
  useQuery({ queryKey: [...ADMIN_MODELS_KEY, params], queryFn: () => api.getAdminModels3d(params), placeholderData: (prev) => prev });

const useAdminModelMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_MODELS_KEY });
      qc.invalidateQueries({ queryKey: ['models3d'] }); // thư viện công khai đổi theo (ẩn / hiện / mẫu mới)
      qc.invalidateQueries({ queryKey: ['products'] }); // badge 3D + bộ lọc has3d
    },
  });
};
export const useCreateAdminModel3d = () => useAdminModelMutation(api.createAdminModel3d);
export const useUpdateAdminModel3d = () => useAdminModelMutation(api.updateAdminModel3d);
export const useSetAdminModel3dStatus = () => useAdminModelMutation(api.setAdminModel3dStatus);
export const useDeleteAdminModel3d = () => useAdminModelMutation(api.deleteAdminModel3d);
export const useLinkProductModel3d = () => useAdminModelMutation(api.linkProductModel3d);
export const useUnlinkProductModel3d = () => useAdminModelMutation(api.unlinkProductModel3d);

// ----- Áp dụng chất liệu bằng AI (BE-05) -----
export const useRetextureModel = () => useMutation({ mutationFn: api.retextureModel });
export const useModelVariants = (modelId) =>
  useQuery({ queryKey: ['modelVariants', modelId], queryFn: () => api.getModelVariants(modelId), enabled: !!modelId });
