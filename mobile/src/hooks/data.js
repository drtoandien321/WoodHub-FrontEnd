import { useQuery } from '@tanstack/react-query';
import { api, pageOf } from '../api/client.js';

/*
 * Hook dữ liệu dùng chung (React Query). Khoá cache giống web để dễ đối chiếu; cache bị xoá khi đổi tài khoản (App.js).
 */
export const useModels = (params = { size: 50 }) =>
  useQuery({ queryKey: ['models3d', params], queryFn: () => api.getModels3d(params).then((d) => pageOf(d).items) });

export const useProducts = (params) =>
  useQuery({ queryKey: ['products', params], queryFn: () => api.getProducts(params).then((d) => ({ ...pageOf(d), total: d?.totalElements ?? d?.page?.totalElements })) });

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories(), staleTime: 10 * 60_000 });

export const useMaterials = () =>
  useQuery({ queryKey: ['materials'], queryFn: () => api.getMaterials(), staleTime: 10 * 60_000 });

export const useWorkshops = () =>
  useQuery({ queryKey: ['workshops-public'], queryFn: () => api.getPublicSuppliers({ type: 'workshop', size: 50 }).then((d) => pageOf(d).items) });

export const useMyDesigns = () =>
  useQuery({ queryKey: ['my-designs'], queryFn: () => api.getMyDesigns({ size: 30 }).then((d) => pageOf(d).items) });

export const useMyQuotes = () =>
  useQuery({ queryKey: ['my-quotes'], queryFn: () => api.getMyQuotes({ size: 50 }).then((d) => pageOf(d).items) });

export const useMyModels = () =>
  useQuery({ queryKey: ['my-models'], queryFn: () => api.getMyModels({ size: 30 }).then((d) => pageOf(d).items) });
