import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Hooks giỏ hàng — giỏ nằm ở SERVER (/api/cart), không còn localStorage (stores/cartStore.js cũ đã bỏ).
 *
 * Vì sao dùng React Query thay vì zustand: giỏ giờ là "server state" (nguồn sự thật ở BE, có thể đổi
 * từ máy khác / sau khi checkout), React Query lo sẵn cache + loading + refetch. Zustand chỉ hợp với
 * "client state" thuần (theme, modal...).
 *
 * Mọi endpoint giỏ đều trả TOÀN BỘ CartResponse → mutation thành công chỉ cần setQueryData() ghi
 * đè cache là UI (trang giỏ, badge header) cập nhật ngay, KHÔNG phải gọi lại GET /cart.
 *
 * Hướng (a) đã chốt: giỏ CHỈ dành cho người đã đăng nhập — khách chưa login bấm "Thêm vào giỏ" sẽ bị
 * đưa sang /login (xử lý ở ProductDetail), nên query tắt (enabled=false) khi chưa có token.
 */
export const CART_QUERY_KEY = ['cart'];

export const useCart = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({ queryKey: CART_QUERY_KEY, queryFn: api.getCart, enabled: !!token });
};

// Dùng chung cho mọi mutation: response của BE chính là giỏ mới nhất → ghi thẳng vào cache
const useCartMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (cart) => qc.setQueryData(CART_QUERY_KEY, cart) });
};

// body: { variantId, quantity } — đã có trong giỏ thì BE CỘNG DỒN
export const useAddCartItem = () => useCartMutation(api.addCartItem);
// { itemId, quantity } — itemId là id DÒNG giỏ (CartItemResponse.id), GHI ĐÈ số lượng
export const useUpdateCartItem = () => useCartMutation(api.updateCartItem);
// itemId
export const useRemoveCartItem = () => useCartMutation(api.removeCartItem);
export const useClearCart = () => useCartMutation(api.clearCart);

/*
 * Lấy câu báo lỗi dễ hiểu từ lỗi API giỏ hàng. BE trả lỗi chuẩn Spring { status, message, ... };
 * map theo mã HTTP trước (ổn định hơn message), rơi về message của BE nếu có.
 */
export const cartErrorKey = (error) => {
  const status = error?.response?.status;
  if (status === 409) return 'cart.errInactive';
  if (status === 404) return 'cart.errNotFound';
  if (status === 400) return 'cart.errInvalid';
  return 'cart.errGeneric';
};
