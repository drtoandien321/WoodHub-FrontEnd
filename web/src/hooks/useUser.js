import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Hooks cho trang Profile — cùng pattern useProducts.js (React Query bọc api/client).
 * enabled: !!token — chỉ gọi /users/me khi đã đăng nhập (tránh gọi thừa lúc chưa auth).
 */
export const useMe = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({ queryKey: ['user', 'me'], queryFn: api.getMe, enabled: !!token });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const patchUser = useAuthStore((s) => s.patchUser);
  return useMutation({
    mutationFn: api.updateUser,
    onSuccess: (data) => {
      // Đồng bộ luôn authStore (Header hiển thị "Chào, {tên}" đọc từ đây, không phải từ query cache)
      patchUser({ name: data.fullName, phone: data.phone });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
};

// Dùng chung cho cả đổi mật khẩu tự nguyện (Profile) lẫn bắt buộc (ChangePasswordRequired)
export const useChangePassword = () => useMutation({ mutationFn: api.changePassword });
