import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Portfolio của CHÍNH supplier đang đăng nhập (SupplierPortfolioController /suppliers/me/portfolio).
 * Thêm/sửa/xoá xong chỉ cần invalidate 1 key — danh sách nhỏ (vài chục ảnh) nên refetch rẻ hơn
 * tự vá mảng trong cache (tránh lệch sortOrder do BE tự sắp xếp).
 */
const KEY = ['myPortfolio'];

export const useMyPortfolio = () => useQuery({ queryKey: KEY, queryFn: api.getMyPortfolio });

const useInvalidatingMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }) });
};

export const useAddPortfolioItem = () => useInvalidatingMutation(api.addPortfolioItem);
export const useUpdatePortfolioItem = () => useInvalidatingMutation(api.updatePortfolioItem);
export const useDeletePortfolioItem = () => useInvalidatingMutation(api.deletePortfolioItem);
