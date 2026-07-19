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
