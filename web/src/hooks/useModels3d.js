import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho nhánh AI 3D (Mẫu 3D / Upload).
 * useGenTask dùng refetchInterval để POLL tiến trình dựng cho tới khi 'succeeded' thì dừng —
 * khi cắm Meshy thật chỉ cần BE trả cùng shape { status, progress, modelSlug }, không sửa UI.
 */
export const useModels3d = () =>
  useQuery({ queryKey: ['models3d'], queryFn: api.getModels3d });

export const useModel3d = (slug) =>
  useQuery({ queryKey: ['model3d', slug], queryFn: () => api.getModel3d(slug), enabled: !!slug, retry: false });

export const useGenerate3D = () => useMutation({ mutationFn: api.generate3D });

export const useGenTask = (taskId) =>
  useQuery({
    queryKey: ['genTask', taskId],
    queryFn: () => api.getGenTask(taskId),
    enabled: !!taskId,
    refetchInterval: (query) => (query.state.data?.status === 'succeeded' ? false : 1500),
  });
