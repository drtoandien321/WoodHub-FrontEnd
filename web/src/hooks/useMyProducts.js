import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Portal Nhà cung cấp quản lý sản phẩm THẬT (/portal/supplier/products).
 * (Portal cũ /portal + hooks/useSupplier.js đã xoá — portal này là bản chính thức duy nhất.)
 */
const invalidateProduct = (qc, id) => {
  qc.invalidateQueries({ queryKey: ['myProducts'] });
  if (id) qc.invalidateQueries({ queryKey: ['myProduct', id] });
};

export const useMyProducts = (params) =>
  useQuery({ queryKey: ['myProducts', params], queryFn: () => api.getMyProducts(params) });

export const useMyProductDetail = (id) =>
  useQuery({ queryKey: ['myProduct', id], queryFn: () => api.getMyProductDetail(id), enabled: !!id, retry: false });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createProduct, onSuccess: () => invalidateProduct(qc) });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateProduct, onSuccess: (data) => invalidateProduct(qc, data.id) });
};

export const useUpdateProductStatus = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateProductStatus, onSuccess: (data) => invalidateProduct(qc, data.id) });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteProduct, onSuccess: () => invalidateProduct(qc) });
};

// ===== Variant =====
export const useVariants = (productId) =>
  useQuery({ queryKey: ['variants', productId], queryFn: () => api.getVariants(productId), enabled: !!productId });

export const useCreateVariant = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createVariant, onSuccess: (_data, vars) => invalidateProduct(qc, vars.productId) });
};

export const useUpdateVariant = (productId) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateVariant, onSuccess: () => invalidateProduct(qc, productId) });
};

export const useDeleteVariant = (productId) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteVariant, onSuccess: () => invalidateProduct(qc, productId) });
};

// ===== Image =====
export const useUploadProductImage = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.uploadProductImage, onSuccess: (_data, vars) => invalidateProduct(qc, vars.productId) });
};

export const useSetPrimaryImage = (productId) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.setPrimaryImage, onSuccess: () => invalidateProduct(qc, productId) });
};

export const useDeleteProductImage = (productId) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteProductImage, onSuccess: () => invalidateProduct(qc, productId) });
};
