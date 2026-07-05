import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Mutation cho Portal Quản trị quản lý VẬT LIỆU (/admin/materials). Phần đọc TÁI DÙNG
 * useMaterials đã có sẵn ở hooks/useCatalog.js (dùng chung với dropdown chọn vật liệu ở Product
 * form) — chỉ viết thêm 3 mutation ở đây, cùng pattern với useAdminCategories.js.
 */
const invalidateMaterials = (qc) => qc.invalidateQueries({ queryKey: ['materials'] });

export const useCreateMaterial = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createMaterial, onSuccess: () => invalidateMaterials(qc) });
};

export const useUpdateMaterial = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateMaterial, onSuccess: () => invalidateMaterials(qc) });
};

export const useDeleteMaterial = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteMaterial, onSuccess: () => invalidateMaterials(qc) });
};
