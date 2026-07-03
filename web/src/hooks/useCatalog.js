import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho bảng tham chiếu Category/Material — chỉ đọc (tạo/sửa/xoá là admin, chưa có UI).
 * staleTime dài hơn mặc định (60s ở QueryClient) vì đây là dữ liệu gần như tĩnh, ít đổi.
 */
const REFERENCE_STALE_TIME = 5 * 60_000; // 5 phút

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: api.getCategories, staleTime: REFERENCE_STALE_TIME });

export const useCategoryTree = () =>
  useQuery({ queryKey: ['categories', 'tree'], queryFn: api.getCategoryTree, staleTime: REFERENCE_STALE_TIME });

export const useMaterials = () =>
  useQuery({ queryKey: ['materials'], queryFn: api.getMaterials, staleTime: REFERENCE_STALE_TIME });
