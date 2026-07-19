import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho CustomDesign (BE-6) — Custom Studio wizard bước 5 (chỉnh) / bước 6 (lưu + "Thiết kế của tôi").
 */
export const useMyDesigns = (params) =>
  useQuery({ queryKey: ['myDesigns', params], queryFn: () => api.getMyDesigns(params) });

export const useDesignDetail = (id) =>
  useQuery({ queryKey: ['design', id], queryFn: () => api.getDesignDetail(id), enabled: !!id, retry: false });

export const useCreateDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDesign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myDesigns'] }),
  });
};

/*
 * Optimistic locking (version) là trách nhiệm của NƠI GỌI: luôn truyền `version` đang giữ trong
 * state, đọc lại design mới nhất khi gặp 409 (xem utils/ai3dErrors.js) thay vì tự tăng version ở FE.
 */
export const useUpdateDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateDesign,
    onSuccess: (design) => {
      queryClient.setQueryData(['design', design.id], design);
      queryClient.invalidateQueries({ queryKey: ['myDesigns'] });
    },
  });
};

export const useDeleteDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteDesign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myDesigns'] }),
  });
};
