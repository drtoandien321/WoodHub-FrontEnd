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
      qc.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY }); // lượt dùng voucher đã thay đổi
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

/*
 * Voucher dùng được cho giỏ hiện tại (GET /vouchers/available) — thay cho tra mã tay (BE đã bỏ).
 * cartKey = chữ ký giỏ (biến thể × số lượng): giỏ đổi → queryKey đổi → tự tải lại, vì eligible/estimatedDiscount
 * tính theo giỏ. addressId đổi cũng tải lại (BE cần địa chỉ để ước tính voucher vận chuyển).
 */
export const VOUCHERS_QUERY_KEY = ['vouchers'];
export const useAvailableVouchers = ({ addressId, cartKey, enabled = true }) =>
  useQuery({
    queryKey: [...VOUCHERS_QUERY_KEY, addressId ?? null, cartKey],
    queryFn: () => api.getAvailableVouchers(addressId ? { addressId } : undefined),
    enabled,
    staleTime: 30_000,
  });

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

/*
 * Xem trước đơn (BE-07): POST /orders/preview — cùng phép tính với checkout nên phí ship / giảm giá / tổng KHỚP số tiền
 * khi đặt thật. Dùng useQuery (POST nhưng không đổi dữ liệu) để tự gọi lại khi đổi địa chỉ / voucher / giỏ.
 * keepPreviousData: giữ số cũ trong lúc tính lại → tóm tắt không nháy về "đang tính".
 */
export const useOrderPreview = ({ addressId, promotionIds, cartKey, enabled = true }) =>
  useQuery({
    queryKey: ['orderPreview', addressId ?? null, [...(promotionIds ?? [])].sort().join(','), cartKey],
    queryFn: () => api.previewOrder({ addressId, promotionIds: promotionIds?.length ? promotionIds : undefined }),
    enabled: enabled && !!addressId,
    placeholderData: (prev) => prev,
    staleTime: 15_000,
    retry: false,
  });
