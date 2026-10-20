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
