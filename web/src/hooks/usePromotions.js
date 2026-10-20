import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks khuyến mãi (/promotions) + cấu hình phí ship (/admin/shipping-config).
 * Cùng 1 endpoint cho admin và supplier — BE tự lọc theo token (admin thấy tất cả, supplier thấy
 * KM của mình) nên FE không cần truyền supplierId.
 */
const PROMOTIONS_KEY = ['promotions'];

export const usePromotions = (params) =>
  useQuery({ queryKey: [...PROMOTIONS_KEY, params], queryFn: () => api.getPromotions(params), placeholderData: (prev) => prev });

const usePromotionMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey: PROMOTIONS_KEY }) });
};
export const useCreatePromotion = () => usePromotionMutation(api.createPromotion);
export const useUpdatePromotion = () => usePromotionMutation(api.updatePromotion);
export const useDeletePromotion = () => usePromotionMutation(api.deletePromotion);

const SHIPPING_CONFIG_KEY = ['shippingConfig'];
export const useShippingConfig = () => useQuery({ queryKey: SHIPPING_CONFIG_KEY, queryFn: api.getShippingConfig });
export const useUpdateShippingConfig = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateShippingConfig, onSuccess: (cfg) => qc.setQueryData(SHIPPING_CONFIG_KEY, cfg) });
};
