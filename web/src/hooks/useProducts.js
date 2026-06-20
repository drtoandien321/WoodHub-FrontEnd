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
export const useProducts = (params) => {
  const { i18n } = useTranslation();
  return useQuery({ queryKey: ['products', params, i18n.language], queryFn: () => api.getProducts(params) });
};

export const useFeaturedProducts = () => {
  const { i18n } = useTranslation();
  return useQuery({ queryKey: ['products', 'featured', i18n.language], queryFn: api.getFeaturedProducts });
};

export const useProduct = (id) => {
  const { i18n } = useTranslation();
  return useQuery({ queryKey: ['product', id, i18n.language], queryFn: () => api.getProduct(id), enabled: !!id });
};

export const useOrders = () =>
  useQuery({ queryKey: ['orders'], queryFn: () => api.getOrders() });

export const useOrder = (id) =>
  useQuery({ queryKey: ['order', id], queryFn: () => api.getOrder(id), enabled: !!id });

export const useProductTypes = () =>
  useQuery({ queryKey: ['productTypes'], queryFn: api.getProductTypes });

// useMutation cho hành động ghi (POST/PATCH) — có isPending để disable nút khi đang gửi
export const useCreateOrder = () => useMutation({ mutationFn: api.createOrder });
export const useSaveDesign = () => useMutation({ mutationFn: api.saveDesign });

export const useWorkshopMatch = (designId) =>
  useQuery({
    queryKey: ['workshopMatch', designId],
    queryFn: () => api.matchWorkshops({ designId }),
    enabled: !!designId,
  });

export const useWorkshops = () =>
  useQuery({ queryKey: ['workshops'], queryFn: api.getWorkshops });

export const usePlans = () =>
  useQuery({ queryKey: ['plans'], queryFn: api.getPlans });

export const useSubmitContact = () => useMutation({ mutationFn: api.submitContact });
