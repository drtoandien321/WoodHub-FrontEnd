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

/*
 * Hồ sơ doanh nghiệp. BE trả 404 khi CHƯA có hồ sơ — đó là trạng thái bình thường của khách cá nhân, không
 * phải lỗi → queryFn đổi 404 thành null để component phân biệt "chưa có" (hiện form tạo) với lỗi thật.
 */
const BUSINESS_PROFILE_KEY = ['user', 'businessProfile'];

export const useBusinessProfile = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: BUSINESS_PROFILE_KEY,
    queryFn: async () => {
      try {
        return await api.getBusinessProfile();
      } catch (err) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled,
    retry: false,
  });

// create hoặc update tuỳ đã có hồ sơ chưa. Tạo mới → BE tự nâng customerType lên business → đồng bộ authStore
// (Header, trang /b2b, các CTA đọc user.customerType từ đây).
export const useSaveBusinessProfile = () => {
  const queryClient = useQueryClient();
  const patchUser = useAuthStore((s) => s.patchUser);
  return useMutation({
    mutationFn: ({ exists, ...body }) => (exists ? api.updateBusinessProfile(body) : api.createBusinessProfile(body)),
    onSuccess: (data, { exists }) => {
      queryClient.setQueryData(BUSINESS_PROFILE_KEY, data);
      if (!exists) {
        patchUser({ customerType: 'business' });
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      }
    },
  });
};
