import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Portal Quản trị — DASHBOARD tổng quan (/admin/dashboard). Toàn bộ API chỉ đọc.
 * `params` = { from, to, limit? } (ISO-8601, tùy chọn). Đưa params vào queryKey để đổi khoảng
 * thời gian thì react-query tự gọi lại; keepPreviousData giữ số cũ trên màn hình tới khi có số mới.
 */
const opts = { placeholderData: keepPreviousData };

export const useAdminDashboardSummary = (params) =>
  useQuery({ queryKey: ['adminDashboardSummary', params], queryFn: () => api.getAdminDashboardSummary(params), ...opts });

export const useAdminDashboardTimeseries = (params) =>
  useQuery({ queryKey: ['adminDashboardTimeseries', params], queryFn: () => api.getAdminDashboardTimeseries(params), ...opts });

export const useAdminDashboardTop = (params) =>
  useQuery({ queryKey: ['adminDashboardTop', params], queryFn: () => api.getAdminDashboardTop(params), ...opts });

/*
 * Traffic GA4. Không retry khi 503 (BE chưa cấu hình GA — thử lại vô ích, chỉ làm khối chờ lâu hơn).
 * BE đã cache 5–10 phút nên FE để staleTime 5 phút, tránh gọi GA thừa khi qua lại trang.
 */
export const useAdminDashboardTraffic = (params) =>
  useQuery({
    queryKey: ['adminDashboardTraffic', params],
    queryFn: () => api.getAdminDashboardTraffic(params),
    staleTime: 5 * 60_000,
    retry: (count, error) => error?.response?.status !== 503 && count < 2,
    ...opts,
  });

/*
 * Lượt bán gói (ô KPI thứ 3): đếm giao dịch ĐÃ THANH TOÁN của gói đăng ký + gói lượt thiết kế trong kỳ.
 * BE chưa có số này trong /admin/dashboard/summary (subscriptions.activeTotal đếm cả gói Free — 0đ, không phát sinh
 * giao dịch) → dùng GET /admin/payments?status=paid&purpose=… (lọc có sẵn của trang Thanh toán):
 * totalElements = số lượt bán, cộng `amount` của trang (size 500 — đủ cho quy mô hiện tại) = doanh thu từ gói.
 */
const SALE_PAGE = 500;
const sumAmount = (page) => (page?.content ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0);
export function useAdminPlanSales(params) {
  const q = (purpose) => ({
    queryKey: ['adminPlanSales', purpose, params],
    queryFn: () => api.getAdminPayments({ ...params, status: 'paid', purpose, page: 0, size: SALE_PAGE }),
    ...opts,
  });
  const sub = useQuery(q('subscription'));
  const pack = useQuery(q('credit_pack'));
  if (!sub.data || !pack.data) return { data: null, isLoading: sub.isLoading || pack.isLoading };
  const subscriptions = sub.data.page?.totalElements ?? sub.data.content?.length ?? 0;
  const creditPacks = pack.data.page?.totalElements ?? pack.data.content?.length ?? 0;
  return {
    data: { total: subscriptions + creditPacks, subscriptions, creditPacks, revenue: sumAmount(sub.data) + sumAmount(pack.data) },
    isLoading: false,
  };
}
