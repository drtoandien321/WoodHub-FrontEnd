import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Hooks sổ địa chỉ giao hàng (/api/addresses).
 *
 * Khác giỏ hàng (mỗi mutation trả lại cả giỏ), ở đây mutation chỉ trả 1 địa chỉ — nhưng BE còn
 * TỰ đổi cờ isDefault của các địa chỉ KHÁC (đặt mặc định mới, xoá địa chỉ mặc định → đề bạt địa
 * chỉ mới nhất). FE không tự đoán lại logic đó mà invalidate để lấy danh sách chuẩn từ BE —
 * đơn giản và luôn đúng, đổi lại tốn thêm 1 request GET (danh sách địa chỉ rất nhỏ nên chấp nhận được).
 *
 * ⚠️ PUT là GHI ĐÈ TOÀN BỘ: field nào không gửi (kể cả latitude/longitude) sẽ bị BE set null.
 * Luôn gửi đủ body (AddressFormModal đã lo việc này), đừng gửi kiểu "chỉ field thay đổi".
 */
export const ADDRESSES_QUERY_KEY = ['addresses'];

// enabled: tắt khi không cần sổ địa chỉ (vd xưởng xem đơn custom — QA BUG-022)
export const useAddresses = ({ enabled = true } = {}) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({ queryKey: ADDRESSES_QUERY_KEY, queryFn: api.getAddresses, enabled: !!token && enabled });
};

const useAddressMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY }) });
};

export const useCreateAddress = () => useAddressMutation(api.createAddress);
export const useUpdateAddress = () => useAddressMutation(api.updateAddress);
export const useDeleteAddress = () => useAddressMutation(api.deleteAddress);
export const useSetDefaultAddress = () => useAddressMutation(api.setDefaultAddress);

// Ghép địa chỉ thành 1 dòng để hiển thị: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
export const formatAddressLine = (a) => [a.addressLine, a.ward, a.district, a.city].filter(Boolean).join(', ');
