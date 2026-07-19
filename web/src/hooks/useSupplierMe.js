import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * useSupplierMe — hồ sơ supplier CHÍNH đang đăng nhập (GET /suppliers/me).
 * authStore.user.supplierType (từ AuthResponse, BE-0) đủ để biết retailer|workshop cho việc
 * điều hướng portal/hiển thị nhãn — dùng hook này khi cần THÊM field khác của hồ sơ (status,
 * commissionRate, taxCode...) mà AuthResponse không có, vd gate nút "Thêm chi nhánh".
 */
export const useSupplierMe = () =>
  useQuery({ queryKey: ['supplierMe'], queryFn: api.getSupplierMe, staleTime: 5 * 60_000 });
