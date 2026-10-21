import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks thống kê NCC / xưởng (BE-09). Đổi kỳ / chi nhánh → queryKey đổi → tải lại; keepPreviousData giữ số cũ
 * trên màn hình trong lúc chờ (không nháy về skeleton mỗi lần đổi bộ lọc).
 */
const opts = { placeholderData: keepPreviousData, staleTime: 60_000 };

export const useSupplierStatsSummary = (params) =>
  useQuery({ queryKey: ['supplierStats', 'summary', params], queryFn: () => api.getSupplierStatsSummary(params), ...opts });

export const useSupplierStatsTimeseries = (params) =>
  useQuery({ queryKey: ['supplierStats', 'timeseries', params], queryFn: () => api.getSupplierStatsTimeseries(params), ...opts });

export const useSupplierStatsTopProducts = (params) =>
  useQuery({ queryKey: ['supplierStats', 'top', params], queryFn: () => api.getSupplierStatsTopProducts(params), ...opts });
