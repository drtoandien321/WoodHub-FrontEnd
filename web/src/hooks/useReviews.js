import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks đánh giá (/reviews) — dùng chung cho SẢN PHẨM và NHÀ CUNG CẤP (targetType 'product' | 'supplier').
 *
 * Mọi queryKey bắt đầu bằng 'reviews' (kể cả useSupplierReviews cũ trong usePublicSuppliers.js) → sau
 * khi viết/sửa/xoá chỉ cần invalidate ['reviews'] là danh sách, điểm trung bình ở header hồ sơ NCC và
 * trang portal đều cập nhật, không phải nhớ từng key.
 */
const REVIEWS_KEY = ['reviews'];

// params: { page, size } — BE trả mới nhất trước
export const useReviews = (targetType, targetId, params = { size: 20 }) =>
  useQuery({
    queryKey: [...REVIEWS_KEY, targetType, targetId, params],
    queryFn: () => api.getReviews({ targetType, targetId, ...params }),
    enabled: !!targetId,
    placeholderData: (prev) => prev,
  });

// staleTime 5 phút: thẻ sản phẩm gọi hàng loạt (Shop/Landing) → không gọi lại mỗi lần quay về trang.
// Viết/sửa/xoá đánh giá vẫn invalidate ['reviews'] nên số liệu cập nhật ngay sau thao tác của chính user.
export const useReviewSummary = (targetType, targetId) =>
  useQuery({
    queryKey: [...REVIEWS_KEY, 'summary', targetType, targetId],
    queryFn: () => api.getReviewSummary({ targetType, targetId }),
    enabled: !!targetId,
    staleTime: 5 * 60_000,
  });

const useReviewMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }) });
};
// { targetType, targetId, rating, comment? }
export const useCreateReview = () => useReviewMutation(api.createReview);
// { id, rating, comment? }
export const useUpdateReview = () => useReviewMutation(api.updateReview);
export const useDeleteReview = () => useReviewMutation(api.deleteReview);

// Phân bố số sao (5→1) tính từ các đánh giá đã tải — BE summary chỉ có average + count
export const ratingDistribution = (reviews = []) =>
  [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
