import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, pageOf } from '../api/client.js';

/*
 * Hook mua hàng (đợt 3) — port từ web hooks/useCart.js, useAddresses.js, useOrders.js, cùng queryKey để dễ đối chiếu.
 * Giỏ: mọi mutation trả về CartResponse mới nhất → ghi thẳng vào cache (không GET lại).
 */
export const CART_KEY = ['cart'];
export const ADDRESSES_KEY = ['addresses'];
export const ORDERS_KEY = ['orders'];
export const VOUCHERS_KEY = ['vouchers'];

export const useCart = () => useQuery({ queryKey: CART_KEY, queryFn: api.getCart, staleTime: 30_000 });

const useCartMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (cart) => qc.setQueryData(CART_KEY, cart) });
};
export const useAddCartItem = () => useCartMutation(api.addCartItem);
export const useUpdateCartItem = () => useCartMutation(api.updateCartItem);
export const useRemoveCartItem = () => useCartMutation(api.removeCartItem);

// Chữ ký giỏ (biến thể × số lượng): giỏ đổi → voucher/preview tự tính lại
export const cartKeyOf = (cart) => (cart?.items ?? []).map((i) => `${i.variantId ?? i.id}x${i.quantity}`).join(',');

// Lỗi giỏ → câu tiếng Việt (map theo mã HTTP giống web cartErrorKey)
export const cartErrMsg = (e) => {
  const s = e?.response?.status;
  if (s === 409) return 'Sản phẩm này đã ngừng bán.';
  if (s === 404) return 'Không tìm thấy phiên bản sản phẩm.';
  if (s === 400) return e?.response?.data?.message || 'Số lượng không hợp lệ.';
  if (!e?.response) return 'Không có kết nối mạng.';
  return e?.response?.data?.message || 'Không cập nhật được giỏ hàng.';
};

// ----- Sổ địa chỉ -----
export const useAddresses = ({ enabled = true } = {}) =>
  useQuery({ queryKey: ADDRESSES_KEY, queryFn: api.getAddresses, enabled });
const useAddressMutation = (mutationFn) => {
  const qc = useQueryClient();
  // BE tự giữ bất biến "tối đa 1 mặc định" → làm mới cả danh sách sau mỗi thay đổi
  return useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESSES_KEY }) });
};
export const useCreateAddress = () => useAddressMutation(api.createAddress);
export const useUpdateAddress = () => useAddressMutation(api.updateAddress);
export const useDeleteAddress = () => useAddressMutation(api.deleteAddress);
export const useSetDefaultAddress = () => useAddressMutation(api.setDefaultAddress);
export const formatAddressLine = (a) => [a?.addressLine, a?.ward, a?.district, a?.city].filter(Boolean).join(', ');

// ----- Voucher + xem trước đơn -----
export const useAvailableVouchers = ({ addressId, cartKey, enabled = true }) =>
  useQuery({
    queryKey: [...VOUCHERS_KEY, addressId ?? null, cartKey],
    queryFn: () => api.getAvailableVouchers(addressId ? { addressId } : undefined),
    enabled, staleTime: 30_000,
  });

// POST nhưng không đổi dữ liệu → useQuery để tự tính lại khi đổi địa chỉ / voucher / giỏ; giữ số cũ trong lúc tính
export const useOrderPreview = ({ addressId, promotionIds, cartKey, enabled = true }) =>
  useQuery({
    queryKey: ['orderPreview', addressId ?? null, [...(promotionIds ?? [])].sort().join(','), cartKey],
    queryFn: () => api.previewOrder({ addressId, promotionIds: promotionIds?.length ? promotionIds : undefined }),
    enabled: enabled && !!addressId,
    placeholderData: (prev) => prev,
    staleTime: 15_000, retry: false,
  });

// ----- Đơn hàng -----
export const useOrders = (params = {}) =>
  useQuery({ queryKey: [...ORDERS_KEY, params], queryFn: () => api.getOrders({ size: 30, ...params }).then((d) => pageOf(d).items) });
export const useOrder = (id) => useQuery({ queryKey: ['order', id], queryFn: () => api.getOrder(id), enabled: !!id });

// Checkout xong BE đã XOÁ GIỎ → ghi giỏ rỗng ngay (badge về 0) + làm mới đơn, voucher (lượt dùng đổi)
export const useCheckout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.checkout,
    onSuccess: () => {
      qc.setQueryData(CART_KEY, (cart) => (cart ? { ...cart, items: [], totalItems: 0, totalQuantity: 0, subtotal: 0 } : cart));
      qc.invalidateQueries({ queryKey: CART_KEY });
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      qc.invalidateQueries({ queryKey: VOUCHERS_KEY });
    },
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.cancelOrder,
    onSuccess: (order) => { qc.setQueryData(['order', order.id], order); qc.invalidateQueries({ queryKey: ORDERS_KEY }); },
  });
};

// Thanh toán lại: PaymentResponse cùng id → ghi vào cache để khối QR hiện mã mới ngay và poll tiếp
export const useRepayOrder = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.repayOrder, onSuccess: (p) => { if (p?.id) qc.setQueryData(['payment', p.id], p); } });
};

// Poll 4s/lần tới khi payment hết 'pending' (webhook SePay tự chuyển đơn sang 'paid')
export const usePaymentPoll = (id) =>
  useQuery({
    queryKey: ['payment', id], queryFn: () => api.getPayment(id), enabled: !!id,
    refetchInterval: (q) => (q.state.data?.status && q.state.data.status !== 'pending' ? false : 4000),
  });
