import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, endpointReady } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Đánh giá WoodHub (web + app) — docs/BE-platform-feedback.md.
 * FEEDBACK_ENABLED: true khi đã có BE thật (5 mockKey trong REAL_ENDPOINTS) hoặc đang bật mock. Còn tắt thì mọi nút /
 * popup / khối landing / ô dashboard đều ẩn, tránh chạy dữ liệu giả trên web thật.
 */
export const FEEDBACK_ENABLED = endpointReady('submitPlatformFeedback');
export const FEEDBACK_REWARD = 5;
export const FEEDBACK_MIN_COMMENT = 10;
export const FEEDBACK_MAX_COMMENT = 1000;
// BE đếm số KÝ TỰ sau khi trim (codePointCount, khớp CHECK char_length của Postgres): 1 emoji = 1 ký tự.
// String.length đếm theo UTF-16 (emoji = 2) → '😀' × 5 qua được FE nhưng bị BE trả VALIDATION_FAILED.
export const commentLength = (s = '') => [...s.trim()].length;

/*
 * Đánh giá web của tôi; null = chưa đánh giá (không coi là lỗi) để popup biết còn được mời.
 * BE mới (26/10) trả 200 body rỗng ('') khi chưa đánh giá; BE cũ trả 404 FEEDBACK_NOT_FOUND → nhận CẢ HAI thành null.
 * Với BE cũ trình duyệt vẫn in dòng 404 đỏ ở console (JS không chặn được) → chỉ gọi khi cần:
 *  - Bỏ qua admin: admin quản lý đánh giá ở /admin/feedback, không tự đánh giá sàn.
 *  - `enabled: false` từ nơi gọi (vd popup chỉ hỏi khi đang mở) — trước đây popup gắn ở App gọi trên MỌI trang.
 */
export function useMyPlatformFeedback({ enabled = true } = {}) {
  const userId = useAuthStore((s) => s.user?.id);
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin';
  return useQuery({
    queryKey: ['myPlatformFeedback', userId],
    queryFn: () => api.getMyPlatformFeedback({ platform: 'web' })
      .then((d) => d || null) // body rỗng ('') / null → null (react-query không nhận undefined)
      .catch((e) => {
        if (e?.response?.status === 404) return null;
        throw e;
      }),
    enabled: FEEDBACK_ENABLED && !!userId && !isAdmin && enabled,
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

// Trang /admin/feedback (QA OBS-03): danh sách có lọc + ẩn/hiện đánh giá spam.
export const useAdminFeedbackList = (params) =>
  useQuery({
    queryKey: ['adminFeedback', params],
    queryFn: () => api.getAdminFeedback(params),
    enabled: FEEDBACK_ENABLED,
    placeholderData: keepPreviousData,
  });

// Ẩn chỉ gỡ khỏi landing — điểm TB admin vẫn tính, KHÔNG thu hồi lượt đã tặng (BE-platform-feedback §5.4)
export function useSetFeedbackHidden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.setFeedbackHidden,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminFeedback'] });
      qc.invalidateQueries({ queryKey: ['platformFeedbackSummary'] });
    },
  });
}
