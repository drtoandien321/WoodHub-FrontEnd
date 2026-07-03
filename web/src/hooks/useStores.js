import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Portal Nhà cung cấp quản lý CHI NHÁNH (Store) + TỒN KHO theo biến thể
 * (/portal/supplier/branches). Portal cũ /portal + hooks/useSupplier.js (1 store hồ sơ phẳng,
 * không phải multi-branch thật) đã xoá — đây là bộ hooks chính thức duy nhất cho Store.
 */
const invalidateStores = (qc) => qc.invalidateQueries({ queryKey: ['myStores'] });
const invalidateInventory = (qc, storeId) => {
  qc.invalidateQueries({ queryKey: ['storeInventory'] });
  if (storeId) qc.invalidateQueries({ queryKey: ['storeInventory', storeId] });
};

export const useMyStores = () => useQuery({ queryKey: ['myStores'], queryFn: api.getMyStores });

export const useCreateStore = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createStore, onSuccess: () => invalidateStores(qc) });
};

export const useUpdateStore = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateStore, onSuccess: () => invalidateStores(qc) });
};

export const useDeleteStore = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteStore, onSuccess: () => invalidateStores(qc) });
};

// ===== Inventory (khoá kép storeId + variantId) =====
export const useStoreInventory = (storeId) =>
  useQuery({ queryKey: ['storeInventory', storeId], queryFn: () => api.getStoreInventory(storeId), enabled: !!storeId });

export const useAddStock = (storeId) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.addStock, onSuccess: () => invalidateInventory(qc, storeId) });
};

export const useAdjustStock = (storeId) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.adjustStock, onSuccess: () => invalidateInventory(qc, storeId) });
};

export const useDeleteStock = (storeId) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteStock, onSuccess: () => invalidateInventory(qc, storeId) });
};

export const useVariantInventory = (variantId) =>
  useQuery({ queryKey: ['variantInventory', variantId], queryFn: () => api.getVariantInventory(variantId), enabled: !!variantId });
