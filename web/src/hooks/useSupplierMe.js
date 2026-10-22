import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { initialsOf } from '../utils/initials.js';

/*
 * useSupplierMe — hồ sơ supplier CHÍNH đang đăng nhập (GET /suppliers/me).
 * authStore.user.supplierType (từ AuthResponse, BE-0) đủ để biết retailer|workshop cho việc
 * điều hướng portal/hiển thị nhãn — dùng hook này khi cần THÊM field khác của hồ sơ (status,
 * commissionRate, taxCode...) mà AuthResponse không có, vd gate nút "Thêm chi nhánh".
 */
export const useSupplierMe = () =>
  useQuery({ queryKey: ['supplierMe'], queryFn: api.getSupplierMe, staleTime: 5 * 60_000 });


/*
 * Tên + chữ viết tắt hiển thị trên header portal, lấy từ hồ sơ THẬT (businessName của /suppliers/me).
 * Trước đây 2 layout portal lấy cứng từ file mock (MANUFACTURER/WORKSHOP) → NCC nào đăng nhập cũng
 * thấy "Nội Thất An Phát". Đang tải / chưa có hồ sơ → dùng tạm tên tài khoản đăng nhập.
 */
export const usePortalBrand = (fallbackName) => {
  const { data } = useSupplierMe();
  const name = data?.businessName || fallbackName || 'Nhà cung cấp';
  return { name, initials: initialsOf(name, 'NCC') };
};

