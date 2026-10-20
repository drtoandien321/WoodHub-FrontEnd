import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * useSupplierMe — hồ sơ supplier CHÍNH đang đăng nhập (GET /suppliers/me).
 * authStore.user.supplierType (từ AuthResponse, BE-0) đủ để biết retailer|workshop cho việc
 * điều hướng portal/hiển thị nhãn — dùng hook này khi cần THÊM field khác của hồ sơ (status,
 * commissionRate, taxCode...) mà AuthResponse không có, vd gate nút "Thêm chi nhánh".
 */
export const useSupplierMe = () =>
  useQuery({ queryKey: ['supplierMe'], queryFn: api.getSupplierMe, staleTime: 5 * 60_000 });

// "Nội Thất An Phát" → "AP" (2 từ cuối) — dùng cho avatar chữ trên header portal
const initialsOf = (name = '') =>
  name.trim().split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase() || 'NCC';

/*
 * Tên + chữ viết tắt hiển thị trên header portal, lấy từ hồ sơ THẬT (businessName của /suppliers/me).
 * Trước đây 2 layout portal lấy cứng từ file mock (MANUFACTURER/WORKSHOP) → NCC nào đăng nhập cũng
 * thấy "Nội Thất An Phát". Đang tải / chưa có hồ sơ → dùng tạm tên tài khoản đăng nhập.
 */
export const usePortalBrand = (fallbackName) => {
  const { data } = useSupplierMe();
  const name = data?.businessName || fallbackName || 'Nhà cung cấp';
  return { name, initials: initialsOf(name) };
};

/*
 * PUT /suppliers/me — BE trả SupplierResponse mới → ghi thẳng vào cache ['supplierMe'] (header portal,
 * thẻ tổng quan, trang hồ sơ đều đọc cache này nên đổi tên là cập nhật ngay, không cần refetch).
 */
export const useUpdateSupplierMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateSupplierMe,
    onSuccess: (data) => queryClient.setQueryData(['supplierMe'], data),
  });
};
