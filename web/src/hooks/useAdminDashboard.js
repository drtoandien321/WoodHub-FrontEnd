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
