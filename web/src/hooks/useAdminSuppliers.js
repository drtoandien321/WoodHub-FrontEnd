import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Portal Quản trị quản lý NHÀ CUNG CẤP (/admin/suppliers). Khác hẳn
 * hooks/usePublicSuppliers.js (đó là browse công khai, shape thiếu field nội bộ).
 */
const invalidateSuppliers = (qc, id) => {
  qc.invalidateQueries({ queryKey: ['adminSuppliers'] });
  if (id) qc.invalidateQueries({ queryKey: ['adminSupplier', id] });
};

export const useAdminSuppliers = (params) =>
  useQuery({ queryKey: ['adminSuppliers', params], queryFn: () => api.getAdminSuppliers(params) });

export const useAdminSupplierDetail = (id) =>
  useQuery({ queryKey: ['adminSupplier', id], queryFn: () => api.getAdminSupplierDetail(id), enabled: !!id });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createSupplier, onSuccess: () => invalidateSuppliers(qc) });
};

export const useUpdateSupplierStatus = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateSupplierStatus, onSuccess: (data) => invalidateSuppliers(qc, data.id) });
};
