import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { CART_QUERY_KEY } from './useCart.js';
import { ADDRESSES_QUERY_KEY } from './useAddresses.js';

/*
 * Hooks đơn hàng B2C (/api/orders) — luồng: checkout → hiện QR chung → poll payment → đơn tự 'paid'.
 * Poll payment dùng lại usePayment (hooks/useSubscription.js) vì cùng endpoint GET /payments/{id}.
 */
export const ORDERS_QUERY_KEY = ['orders'];

// Spring Page (BE bật VIA_DTO → { content, page: { number, size, totalElements, totalPages } }).
// Đọc cả kiểu phẳng cũ cho an toàn (docs BE ghi kiểu phẳng), giống AdminPayments.jsx.
export const pageInfoOf = (data) => {
  const src = data?.page ?? data ?? {};
  return { number: src.number ?? 0, totalPages: src.totalPages ?? 1, totalElements: src.totalElements ?? 0 };
};

// params: { status?, page, size }
export const useOrders = (params = {}) =>
  useQuery({ queryKey: [...ORDERS_QUERY_KEY, params], queryFn: () => api.getOrders(params), placeholderData: (prev) => prev });

export const useOrder = (id) =>
  useQuery({ queryKey: ['order', id], queryFn: () => api.getOrder(id), enabled: !!id });

/*
 * Checkout thành công → BE đã XOÁ GIỎ và có thể đã lưu địa chỉ mới (saveAddress) → làm mới các cache
 * đó, cộng với danh sách đơn. Giỏ ghi thẳng về rỗng (không cần chờ refetch) để badge header về 0 ngay.
 */
export const useCheckout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.checkout,
    onSuccess: () => {
      qc.setQueryData(CART_QUERY_KEY, (cart) => (cart ? { ...cart, items: [], totalItems: 0, totalQuantity: 0, subtotal: 0 } : cart));
      qc.invalidateQueries({ queryKey: CART_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.cancelOrder,
    onSuccess: (order) => {
      qc.setQueryData(['order', order.id], order);
      qc.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
};

// Tra cứu coupon trước khi checkout — mutation (không phải query) vì chỉ chạy khi khách bấm "Áp dụng"
export const useLookupPromotion = () => useMutation({ mutationFn: api.lookupPromotion });

/*
 * Trạng thái đơn → class badge daisyUI. Luồng chính:
 * pending_payment → paid → confirmed → processing → shipping → delivered → completed; nhánh cancelled/refunded.
 */
export const ORDER_STATUS_FLOW = ['pending_payment', 'paid', 'confirmed', 'processing', 'shipping', 'delivered', 'completed'];
export const orderStatusBadge = (status) =>
  ({
    pending_payment: 'badge-warning',
    paid: 'badge-info',
    confirmed: 'badge-info',
    processing: 'badge-primary',
    shipping: 'badge-primary',
    delivered: 'badge-success',
    completed: 'badge-success',
    cancelled: 'badge-ghost',
    refunded: 'badge-error',
  })[status] ?? 'badge-neutral';
