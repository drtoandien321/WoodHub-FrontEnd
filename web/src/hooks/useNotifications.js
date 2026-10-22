import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { ensureConnected, onNotification, onConnected } from '../services/chatSocket.js';

/*
 * Hooks thông báo (BE-12). Số chưa đọc + danh sách là query thường; realtime: chatSocket đẩy thông báo mới qua
 * /user/queue/notifications → làm mới 2 query đó (không tự cộng tay để khỏi lệch với BE). Mỗi lần socket kết nối lại
 * cũng làm mới — có thể đã lỡ thông báo lúc mất mạng (docs BE §1.2).
 */
export const NOTIFICATIONS_KEY = ['notifications'];

export const useUnreadNotificationCount = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread'],
    queryFn: api.getUnreadNotificationCount,
    enabled: !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};

export const useNotifications = (params, { enabled = true } = {}) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'list', params],
    queryFn: () => api.getNotifications(params),
    enabled: !!token && enabled,
  });
};

const useNotificationMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }) });
};
export const useMarkNotificationRead = () => useNotificationMutation(api.markNotificationRead);
export const useMarkAllNotificationsRead = () => useNotificationMutation(api.markAllNotificationsRead);

/*
 * Gắn realtime 1 lần ở chỗ có chuông. onNew(n) cho phép nơi gọi phản ứng thêm (vd NCC đang ở trang Đơn hàng thì tải
 * lại danh sách khi có ORDER_PAID — docs no-inventory §4.3).
 */
export function useNotificationRealtime(onNew) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    if (!token) return undefined;
    ensureConnected();
    const refresh = () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    const offNew = onNotification((n) => {
      refresh();
      // Đơn mới đã thanh toán / đơn đổi trạng thái → danh sách đơn đang mở cũng nên cập nhật
      if (n.targetType === 'order') {
        qc.invalidateQueries({ queryKey: ['managedOrders'] });
        qc.invalidateQueries({ queryKey: ['orders'] });
        qc.invalidateQueries({ queryKey: ['order', n.targetId] });
      }
      if (n.targetType === 'custom_order') qc.invalidateQueries({ queryKey: ['customOrder', n.targetId] });
      if (n.targetType === 'review') qc.invalidateQueries({ queryKey: ['supplierReviews'] });
      onNew?.(n);
    });
    const offConnected = onConnected(refresh);
    return () => { offNew(); offConnected(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, qc]);
}
