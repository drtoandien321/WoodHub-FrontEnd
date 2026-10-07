import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Portal Quản trị — QUẢN LÝ THANH TOÁN (/admin/payments). Toàn bộ API chỉ đọc.
 * keepPreviousData: khi đổi trang/bộ lọc, giữ dữ liệu cũ trên màn hình tới khi có dữ liệu mới
 * (tránh bảng nháy trống mỗi lần lọc).
 */
export const useAdminPayments = (params) =>
  useQuery({ queryKey: ['adminPayments', params], queryFn: () => api.getAdminPayments(params), placeholderData: keepPreviousData });

export const useAdminPaymentDetail = (id) =>
  useQuery({ queryKey: ['adminPayment', id], queryFn: () => api.getAdminPayment(id), enabled: !!id });

export const useAdminPaymentStats = (params) =>
  useQuery({ queryKey: ['adminPaymentStats', params], queryFn: () => api.getAdminPaymentStats(params), placeholderData: keepPreviousData });
