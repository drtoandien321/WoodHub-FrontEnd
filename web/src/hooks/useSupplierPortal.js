import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks Portal NCC / xưởng cho các API đợt BE-10 / BE-12 §2 / BE-14:
 *  - đánh giá cần phản hồi + trả lời đánh giá
 *  - hồ sơ PATCH (logo, ảnh bìa, trụ sở) + upload ảnh
 *  - tài khoản nhận tiền + cài đặt email thông báo
 */

// ----- Đánh giá (GET /supplier/reviews) -----
export const SUPPLIER_REVIEWS_KEY = ['supplierReviews'];
export const useSupplierReviewsPortal = (params) =>
  useQuery({
    queryKey: [...SUPPLIER_REVIEWS_KEY, params],
    queryFn: () => api.getSupplierReviewsPortal(params),
    placeholderData: keepPreviousData,
  });

// Trả lời / sửa / xoá phản hồi → làm mới danh sách portal + mọi nơi hiện đánh giá công khai (key 'reviews'),
// và số "chưa phản hồi" ở Báo cáo/Dashboard (supplierStats)
const useReplyMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUPPLIER_REVIEWS_KEY });
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['supplierStats'] });
    },
  });
};
export const useReplyReview = () => useReplyMutation(api.replyReview);
export const useDeleteReviewReply = () => useReplyMutation(api.deleteReviewReply);

// ----- Hồ sơ (PATCH /suppliers/me) + ảnh -----
export const usePatchSupplierMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.patchSupplierMe,
    onSuccess: (data) => qc.setQueryData(['supplierMe'], data),
  });
};
// { file, purpose: 'logo' | 'cover' | 'portfolio' } → { url }
export const useUploadSupplierImage = () => useMutation({ mutationFn: api.uploadSupplierImage });

// ----- Tài khoản nhận tiền -----
export const useMyPayout = () => useQuery({ queryKey: ['myPayout'], queryFn: api.getMyPayout });
export const useSaveMyPayout = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.saveMyPayout, onSuccess: (data) => qc.setQueryData(['myPayout'], data) });
};

// ----- Email thông báo (mọi tài khoản) -----
export const useNotificationSettings = () =>
  useQuery({ queryKey: ['notificationSettings'], queryFn: api.getNotificationSettings });
export const useUpdateNotificationSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateNotificationSettings,
    onSuccess: (data) => qc.setQueryData(['notificationSettings'], data),
  });
};

// ----- Năng lực gia công (chỉ xưởng, BE-10 §3) -----
export const useMyCapability = (options = {}) =>
  useQuery({ queryKey: ['myCapability'], queryFn: api.getMyCapability, ...options });
export const useSaveMyCapability = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.saveMyCapability, onSuccess: (data) => qc.setQueryData(['myCapability'], data) });
};
