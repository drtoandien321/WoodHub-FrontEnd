import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Mutation cho Portal Quản trị quản lý CHUYÊN MỤC (/admin/categories). Phần đọc TÁI DÙNG
 * useCategories/useCategoryTree đã có sẵn ở hooks/useCatalog.js (dùng chung với dropdown chọn
 * danh mục ở Product form) — chỉ viết thêm 3 mutation ở đây.
 */
const invalidateCategories = (qc) => {
  qc.invalidateQueries({ queryKey: ['categories'] }); // khớp cả ['categories'] (flat) và ['categories','tree']
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createCategory, onSuccess: () => invalidateCategories(qc) });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateCategory, onSuccess: () => invalidateCategories(qc) });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteCategory, onSuccess: () => invalidateCategories(qc) });
};
