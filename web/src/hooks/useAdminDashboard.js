import { useQuery, useQueries, keepPreviousData } from '@tanstack/react-query';
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
 * Lượt mua thành công (ô KPI thứ 3): đếm giao dịch ĐÃ THANH TOÁN trong kỳ theo từng loại — gói đăng ký, gói lượt
 * thiết kế, đơn hàng, đơn custom (cọc + thanh toán đủ). BE chưa có số này trong /admin/dashboard/summary
 * (subscriptions.activeTotal đếm cả gói Free — 0đ, không phát sinh giao dịch) → dùng GET /admin/payments?status=paid&purpose=…
 * (lọc có sẵn của trang Thanh toán). Đếm LƯỢT THANH TOÁN (1 tài khoản mua 3 lần = 3), kèm số tài khoản (distinct userId).
 * Lưu ý: 1 lần checkout tách nhiều đơn theo NCC nhưng chỉ 1 giao dịch → "đơn hàng" ở đây là số lần thanh toán đơn.
 * totalElements = số lượt, cộng `paidAmount` của trang (size 500 — đủ cho quy mô hiện tại) = tiền thu được.
 */
const SALE_PAGE = 500;
const SALE_PURPOSES = ['subscription', 'credit_pack', 'order', 'custom_deposit', 'custom_final'];
// paidAmount = tiền thực nhận (có thể khác amount yêu cầu nếu khách chuyển lệch); dự phòng amount
const sumAmount = (page) => (page?.content ?? []).reduce((s, p) => s + Number(p.paidAmount ?? p.amount ?? 0), 0);
const countOf = (page) => page?.page?.totalElements ?? page?.content?.length ?? 0;
export function useAdminPaidSales(params) {
  const results = useQueries({
    queries: SALE_PURPOSES.map((purpose) => ({
      queryKey: ['adminPaidSales', purpose, params],
      queryFn: () => api.getAdminPayments({ ...params, status: 'paid', purpose, page: 0, size: SALE_PAGE }),
      ...opts,
    })),
  });
  if (results.some((r) => !r.data)) return { data: null, isLoading: results.some((r) => r.isLoading) };
  const [sub, pack, order, deposit, final] = results.map((r) => r.data);
  const counts = {
    subscriptions: countOf(sub), creditPacks: countOf(pack), orders: countOf(order),
    customPayments: countOf(deposit) + countOf(final),
  };
  return {
    data: {
      ...counts,
      total: counts.subscriptions + counts.creditPacks + counts.orders + counts.customPayments,
      buyers: new Set(results.flatMap((r) => r.data.content ?? []).map((p) => p.userId)).size,
      revenue: results.reduce((s, r) => s + sumAmount(r.data), 0),
    },
    isLoading: false,
  };
}

/*
 * Điểm đánh giá sản phẩm + NCC (bảng reviews hiện có) cho ô KPI thứ 4, cộng với đánh giá web/app khi BE xong
 * (useAdminFeedbackSummary). Không lọc theo kỳ: điểm uy tín tính trên toàn bộ đánh giá đang hiện, giống trang sản phẩm.
 */
export function useAdminReviewAverage() {
  const q = useQuery({
    queryKey: ['adminReviewAverage'],
    queryFn: () => api.getAdminReviews({ hidden: false, page: 0, size: 500 }),
    staleTime: 5 * 60_000,
  });
  const list = q.data?.content ?? [];
  const count = q.data?.page?.totalElements ?? list.length;
  const avg = list.length ? list.reduce((s, r) => s + Number(r.rating ?? 0), 0) / list.length : null;
  return { data: q.data ? { avgRating: avg, count } : null, isLoading: q.isLoading };
}
