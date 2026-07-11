import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho Portal Quản trị quản lý GÓI ĐĂNG KÝ (/admin/subscription-plans). GET dùng
 * '/subscription-plans/all' (khác GET công khai chỉ trả gói active — xem hooks/useSubscription.js
 * useSubscriptionPlans) vì admin cần thấy CẢ gói đã tắt để bật lại được.
 */
const invalidateAdminPlans = (qc) => {
  qc.invalidateQueries({ queryKey: ['adminSubscriptionPlans'] });
  qc.invalidateQueries({ queryKey: ['subscriptionPlans'] }); // trang Pricing công khai cũng phải thấy thay đổi
};

export const useAdminSubscriptionPlans = () =>
  useQuery({ queryKey: ['adminSubscriptionPlans'], queryFn: api.getAllSubscriptionPlans });

export const useCreateSubscriptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createSubscriptionPlan, onSuccess: () => invalidateAdminPlans(qc) });
};

export const useUpdateSubscriptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateSubscriptionPlan, onSuccess: () => invalidateAdminPlans(qc) });
};

export const useDeleteSubscriptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteSubscriptionPlan, onSuccess: () => invalidateAdminPlans(qc) });
};
