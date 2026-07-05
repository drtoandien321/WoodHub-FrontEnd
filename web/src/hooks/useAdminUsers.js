import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Portal Quản trị quản lý NGƯỜI DÙNG (/admin/users). `useUpdateUser` tái dùng thẳng
 * api.updateUser (cùng endpoint PUT /users/{id} với Profile.jsx tự sửa).
 */
const invalidateUsers = (qc, id) => {
  qc.invalidateQueries({ queryKey: ['adminUsers'] });
  if (id) qc.invalidateQueries({ queryKey: ['adminUser', id] });
};

export const useAdminUsers = (params) =>
  useQuery({ queryKey: ['adminUsers', params], queryFn: () => api.getAdminUsers(params) });

export const useAdminUserDetail = (id) =>
  useQuery({ queryKey: ['adminUser', id], queryFn: () => api.getAdminUserDetail(id), enabled: !!id });

export const useUpdateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateUser, onSuccess: (data) => invalidateUsers(qc, data.id) });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteUser, onSuccess: () => invalidateUsers(qc) });
};
