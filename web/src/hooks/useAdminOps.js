import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks vận hành cho Portal Quản trị:
 *  - Kiểm duyệt đánh giá (BE-11 §2)
 *  - Đơn cần hoàn tiền + xác nhận đã hoàn (no-inventory-order-confirm-fe.md §5.1)
 *  - Liên hệ từ form /contact (BE-06)
 *  - Xem số tài khoản nhận tiền đầy đủ của NCC (BE-14 §1.3)
 */
const listOpts = { placeholderData: keepPreviousData };

// ----- Đánh giá -----
export const useAdminReviews = (params) =>
  useQuery({ queryKey: ['adminReviews', params], queryFn: () => api.getAdminReviews(params), ...listOpts });
const useReviewOp = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminReviews'] });
      qc.invalidateQueries({ queryKey: ['reviews'] }); // đánh giá công khai + điểm TB đổi theo
    },
  });
};
export const useModerateReview = () => useReviewOp(api.moderateReview);
export const useDeleteAdminReview = () => useReviewOp(api.deleteAdminReview);

// ----- Hoàn tiền -----
export const usePendingRefunds = (params) =>
  useQuery({ queryKey: ['pendingRefunds', params], queryFn: () => api.getPendingRefunds(params), ...listOpts });
export const useConfirmRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.confirmRefund,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingRefunds'] });
      qc.invalidateQueries({ queryKey: ['managedOrders'] });
    },
  });
};

// ----- Liên hệ -----
export const useAdminContacts = (params) =>
  useQuery({ queryKey: ['adminContacts', params], queryFn: () => api.getAdminContacts(params), ...listOpts });
export const useUpdateContactStatus = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateContactStatus, onSuccess: () => qc.invalidateQueries({ queryKey: ['adminContacts'] }) });
};

// ----- Payout NCC: chỉ gọi khi admin bấm "Hiện số tài khoản" (mỗi lần xem BE ghi nhật ký) -----
export const useAdminSupplierPayout = (supplierId, enabled) =>
  useQuery({ queryKey: ['adminSupplierPayout', supplierId], queryFn: () => api.getAdminSupplierPayout(supplierId), enabled: !!supplierId && enabled, retry: false, staleTime: 0, gcTime: 0 });
