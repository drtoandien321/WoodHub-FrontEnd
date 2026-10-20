import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks Portal Quản trị — GÓI LƯỢT THIẾT KẾ (credit pack, /admin/credit-packs).
 * Admin thấy cả gói đã tắt (khác GET /credit-packs của khách chỉ trả gói đang bán).
 */
const invalidate = (qc) => {
  qc.invalidateQueries({ queryKey: ['adminCreditPacks'] });
  qc.invalidateQueries({ queryKey: ['creditPacks'] }); // danh sách khách thấy ở "Gói của tôi" cũng đổi theo
};

export const useAdminCreditPacks = () => useQuery({ queryKey: ['adminCreditPacks'], queryFn: api.getAdminCreditPacks });

const useCreditPackMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => invalidate(qc) });
};
export const useCreateCreditPack = () => useCreditPackMutation(api.createCreditPack);
export const useUpdateCreditPack = () => useCreditPackMutation(api.updateCreditPack);
export const useDeleteCreditPack = () => useCreditPackMutation(api.deleteCreditPack);
