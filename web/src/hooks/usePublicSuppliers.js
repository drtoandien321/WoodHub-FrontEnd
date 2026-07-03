import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho trang /suppliers (browse công khai) + /suppliers/:id (hồ sơ).
 * Tách riêng khỏi hooks/useSupplier.js (đó là Portal — CHO chính supplier đang đăng nhập quản lý
 * gian hàng của họ; đây là marketplace công khai, khách/guest xem được).
 *
 * BE trả nhiều thứ RIÊNG (public profile / stores / portfolio / reviews) thay vì gộp 1 response —
 * nên tách hook tương ứng, page tự compose. Không gộp thành 1 mega-hook để tránh 1 field lỗi
 * (vd portfolio 500) làm hỏng luôn phần còn lại của trang.
 */
export const usePublicSuppliers = (params) =>
  useQuery({ queryKey: ['suppliers', 'public', params], queryFn: () => api.getPublicSuppliers(params) });

export const useSupplierPublicProfile = (id) =>
  useQuery({
    queryKey: ['supplier', 'public', id],
    queryFn: () => api.getSupplierPublicProfile(id),
    enabled: !!id,
    retry: false, // sai id → 404 hiện empty state ngay, không cần retry
  });

// Chi nhánh công khai — CHỈ quận/thành phố (BE cố tình không trả địa chỉ đường/tọa độ)
export const useSupplierStores = (id) =>
  useQuery({ queryKey: ['supplier', 'stores', id], queryFn: () => api.getSupplierStores(id), enabled: !!id });

export const useSupplierPortfolio = (id) =>
  useQuery({ queryKey: ['supplier', 'portfolio', id], queryFn: () => api.getSupplierPortfolio(id), enabled: !!id });

export const useSupplierReviews = (supplierId) =>
  useQuery({
    queryKey: ['reviews', 'supplier', supplierId],
    queryFn: () => api.getReviews({ targetType: 'supplier', targetId: supplierId }),
    enabled: !!supplierId,
  });

export const useSupplierReviewSummary = (supplierId) =>
  useQuery({
    queryKey: ['reviews', 'summary', 'supplier', supplierId],
    queryFn: () => api.getReviewSummary({ targetType: 'supplier', targetId: supplierId }),
    enabled: !!supplierId,
  });
