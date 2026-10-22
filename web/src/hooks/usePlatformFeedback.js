import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, endpointReady } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Đánh giá WoodHub (web + app) — docs/BE-platform-feedback.md.
 * FEEDBACK_ENABLED = false trên production cho tới khi BE xong (5 mockKey chưa vào REAL_ENDPOINTS) → mọi nút / popup /
 * khối landing / ô dashboard đều ẩn, tránh chạy dữ liệu giả trên web thật.
 */
export const FEEDBACK_ENABLED = endpointReady('submitPlatformFeedback');
export const FEEDBACK_REWARD = 5;
export const FEEDBACK_MIN_COMMENT = 10;

// Đánh giá web của tôi. 404 = chưa đánh giá → trả null (không coi là lỗi) để popup biết còn được mời.
export function useMyPlatformFeedback() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['myPlatformFeedback', userId],
    queryFn: () => api.getMyPlatformFeedback({ platform: 'web' }).catch((e) => {
      if (e?.response?.status === 404) return null;
      throw e;
    }),
    enabled: FEEDBACK_ENABLED && !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useSubmitPlatformFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.submitPlatformFeedback({ platform: 'web', ...body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myPlatformFeedback'] });
      qc.invalidateQueries({ queryKey: ['platformFeedbackSummary'] });
      qc.invalidateQueries({ queryKey: ['myUsage'] }); // số lượt thiết kế vừa được cộng
    },
  });
}

export const usePlatformFeedbackSummary = () =>
  useQuery({ queryKey: ['platformFeedbackSummary'], queryFn: api.getPlatformFeedbackSummary, enabled: FEEDBACK_ENABLED, staleTime: 10 * 60_000 });

export const useAdminFeedbackSummary = (params) =>
  useQuery({
    queryKey: ['adminFeedbackSummary', params],
    queryFn: () => api.getAdminFeedbackSummary(params),
    enabled: FEEDBACK_ENABLED,
    placeholderData: keepPreviousData,
  });
