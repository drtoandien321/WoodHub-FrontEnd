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
 * Đếm LƯỢT MUA (1 tài khoản mua 3 lần = 3), kèm số tài khoản mua (distinct userId) để không nhầm 2 khái niệm.
 * totalElements = số lượt bán, cộng `amount` của trang (size 500 — đủ cho quy mô hiện tại) = doanh thu từ gói.
 */
const SALE_PAGE = 500;
// paidAmount = tiền thực nhận (có thể khác amount yêu cầu nếu khách chuyển lệch); dự phòng amount
const sumAmount = (page) => (page?.content ?? []).reduce((s, p) => s + Number(p.paidAmount ?? p.amount ?? 0), 0);
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
    data: {
      total: subscriptions + creditPacks, subscriptions, creditPacks,
      buyers: new Set([...(sub.data.content ?? []), ...(pack.data.content ?? [])].map((p) => p.userId)).size,
      revenue: sumAmount(sub.data) + sumAmount(pack.data),
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
