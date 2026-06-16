import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Supplier Portal — cùng pattern useProducts.js (React Query bọc api/client).
 * Mutation invalidate đúng queryKey liên quan để UI tự refetch sau khi ghi.
 */
export const useDashboardStats = () =>
  useQuery({ queryKey: ['supplier', 'dashboard'], queryFn: api.getDashboardStats });

export const useSupplierStore = () =>
  useQuery({ queryKey: ['supplier', 'store'], queryFn: api.getSupplierStore });

export const useUpdateSupplierStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateSupplierStore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplier', 'store'] }),
  });
};

export const useSupplierProducts = () =>
  useQuery({ queryKey: ['supplier', 'products'], queryFn: api.getSupplierProducts });

const invalidateProducts = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['supplier', 'products'] });
  queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
};

export const useCreateSupplierProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.createSupplierProduct, onSuccess: () => invalidateProducts(queryClient) });
};

export const useUpdateSupplierProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.updateSupplierProduct, onSuccess: () => invalidateProducts(queryClient) });
};

export const useDeleteSupplierProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.deleteSupplierProduct, onSuccess: () => invalidateProducts(queryClient) });
};

export const useSupplierOrders = () =>
  useQuery({ queryKey: ['supplier', 'orders'], queryFn: api.getSupplierOrders });

export const useUpdateSupplierOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateSupplierOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'dashboard'] });
    },
  });
};
