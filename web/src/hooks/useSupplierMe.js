import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * useSupplierMe — hồ sơ supplier CHÍNH đang đăng nhập (GET /suppliers/me).
 * Dùng khi cần biết đúng `type` (retailer|workshop) — KHÔNG lấy từ authStore.user.supplierType
 * vì field đó luôn undefined ở chế độ thật (AuthResponse của BE không có field này).
 */
export const useSupplierMe = () =>
  useQuery({ queryKey: ['supplierMe'], queryFn: api.getSupplierMe, staleTime: 5 * 60_000 });
