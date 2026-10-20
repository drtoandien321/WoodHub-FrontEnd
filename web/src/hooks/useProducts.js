import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';

/*
 * Hooks bọc React Query — UI chỉ gọi hook, không gọi api trực tiếp.
 * React Query lo: cache theo queryKey, loading/error state, refetch, dedupe request.
 * queryKey chứa cả params → đổi filter là key đổi → tự fetch lại + cache riêng từng bộ lọc.
 *
 * Với product (tên/mô tả song ngữ): thêm i18n.language vào queryKey → đổi VI/EN là key đổi →
 * refetch và mockAdapter trả dữ liệu đúng ngôn ngữ. (Cache riêng cho mỗi ngôn ngữ luôn.)
 */
export const useProducts = (params, { enabled = true } = {}) => {
  const { i18n } = useTranslation();
  return useQuery({ queryKey: ['products', params, i18n.language], queryFn: () => api.getProducts(params), enabled });
};

export const useProduct = (id) => {
  const { i18n } = useTranslation();
  return useQuery({ queryKey: ['product', id, i18n.language], queryFn: () => api.getProduct(id), enabled: !!id });
};

// (Hooks đơn hàng đã chuyển sang hooks/useOrders.js — luồng checkout mới POST /orders/checkout.)

// (Đã chuyển sang hooks/usePublicSuppliers.js — usePublicSuppliers/useSupplierPublicProfile —
// khớp đúng shape SupplierPublicResponse của BE thật, không dùng slug mà dùng UUID.)

export const useSubmitContact = () => useMutation({ mutationFn: api.submitContact });
