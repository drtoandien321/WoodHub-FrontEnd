import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { ORDERS_QUERY_KEY } from './useOrders.js';

/*
 * Hooks báo giá số lượng lớn (BE-08). Khách DN: gửi / xem / chấp nhận / từ chối / huỷ. NCC: danh sách gửi tới mình,
 * báo giá (gửi lại = thay báo giá cũ), từ chối. Chi tiết dùng chung GET /bulk-quotes/{id}.
 */
export const BULK_QUOTES_KEY = ['bulkQuotes'];

export const useMyBulkQuotes = (params, { enabled = true } = {}) =>
  useQuery({ queryKey: [...BULK_QUOTES_KEY, 'mine', params], queryFn: () => api.getMyBulkQuotes(params), placeholderData: keepPreviousData, enabled });
export const useSupplierBulkQuotes = (params, { enabled = true } = {}) =>
  useQuery({ queryKey: [...BULK_QUOTES_KEY, 'supplier', params], queryFn: () => api.getSupplierBulkQuotes(params), placeholderData: keepPreviousData, enabled });
export const useBulkQuote = (id) =>
  useQuery({ queryKey: [...BULK_QUOTES_KEY, 'detail', id], queryFn: () => api.getBulkQuote(id), enabled: !!id, retry: false });

const useBulkMutation = (mutationFn, extra) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: BULK_QUOTES_KEY });
      extra?.(qc, ...args);
    },
  });
};
export const useCreateBulkQuote = () => useBulkMutation(api.createBulkQuote);
// Chấp nhận → tạo 1 đơn hàng chờ thanh toán → danh sách đơn của khách cũng đổi
export const useAcceptBulkQuote = () => useBulkMutation(api.acceptBulkQuote, (qc) => qc.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }));
export const useRejectBulkQuote = () => useBulkMutation(api.rejectBulkQuote);
export const useCancelBulkQuote = () => useBulkMutation(api.cancelBulkQuote);
export const useOfferBulkQuote = () => useBulkMutation(api.offerBulkQuote);
export const useDeclineBulkQuote = () => useBulkMutation(api.declineBulkQuote);
