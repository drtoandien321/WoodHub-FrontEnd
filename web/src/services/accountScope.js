import { useAuthStore } from '../stores/authStore.js';
import { useCustomStudioStore } from '../stores/customStudioStore.js';

/*
 * accountScope — đảm bảo dữ liệu theo-tài-khoản KHÔNG bị dùng chung khi đổi tài khoản trên cùng trình duyệt.
 *
 * Vấn đề gốc: nhiều store persist vào localStorage (vd customStudioStore: designId/designName/step...) và
 * cache React Query (['myDesigns'], ['design', id]...) đều KHÔNG biết chúng thuộc về ai → tài khoản B đăng
 * nhập sau A sẽ thấy/ghi đè thiết kế của A.
 *
 * Giải pháp 1 chỗ (thay vì vá từng trang):
 *   1) Mỗi lần user (id) đổi — đăng nhập, đăng xuất, đổi tài khoản — xoá TOÀN BỘ cache React Query.
 *   2) Store wizard lưu `ownerId`; nếu ownerId khác user hiện tại thì reset wizard về trạng thái sạch.
 *
 * Gọi initAccountScope() ĐỒNG BỘ trước khi render (main.jsx): zustand persist hydrate đồng bộ từ
 * localStorage nên bước kiểm tra chủ sở hữu chạy xong trước khi bất kỳ trang nào đọc store — nếu để trong
 * useEffect, trang con (CustomStudio) sẽ đọc dữ liệu của tài khoản cũ trước khi kịp reset.
 */
export function initAccountScope(queryClient) {
  let prevUserId = useAuthStore.getState().user?.id ?? null;

  const syncStudioOwner = (userId) => {
    const studio = useCustomStudioStore.getState();
    if ((studio.ownerId ?? null) !== userId) {
      studio.reset();
      studio.setOwner(userId);
    }
  };

  syncStudioOwner(prevUserId);

  return useAuthStore.subscribe((state) => {
    const userId = state.user?.id ?? null;
    if (userId === prevUserId) return; // chỉ phản ứng khi ĐỔI người dùng, không phải mọi thay đổi auth (vd refresh token)
    prevUserId = userId;
    queryClient.clear();
    syncStudioOwner(userId);
  });
}
