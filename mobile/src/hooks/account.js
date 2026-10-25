import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, pageOf } from '../api/client.js';
import { useAuth } from '../store/auth.js';

/* Hook tài khoản (đợt 4): hồ sơ, mật khẩu, hồ sơ doanh nghiệp, gói lượt, báo giá số lượng lớn — port từ web. */

// Cập nhật user trong auth store (tên hiển thị, loại khách) mà không đổi token
const patchUser = (patch) => {
  const s = useAuth.getState();
  return s.setAuth({ token: s.token, refreshToken: s.refreshToken, user: { ...s.user, ...patch } });
};

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: api.getMe });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateUser,
    onSuccess: (u) => { qc.setQueryData(['me'], u); patchUser({ name: u?.fullName }); },
  });
};

export const useChangePassword = () => useMutation({ mutationFn: api.changePassword });

export const useBusinessProfile = () => useQuery({ queryKey: ['businessProfile'], queryFn: api.getBusinessProfile });
export const useSaveBusinessProfile = (exists) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: exists ? api.updateBusinessProfile : api.createBusinessProfile,
    onSuccess: (bp) => {
      qc.setQueryData(['businessProfile'], bp);
      // POST tạo hồ sơ → BE nâng tài khoản lên business: cập nhật ngay để hiện báo giá sỉ / VAT không cần đăng nhập lại
      if (!exists) { patchUser({ customerType: 'business' }); qc.invalidateQueries({ queryKey: ['me'] }); }
    },
  });
};

export const useCreditPacks = () => useQuery({ queryKey: ['creditPacks'], queryFn: api.getCreditPacks, staleTime: 5 * 60_000 });

export const BULK_KEY = ['bulkQuotes'];
export const useMyBulkQuotes = (status) => useQuery({ queryKey: [...BULK_KEY, status || 'all'], queryFn: () => api.getMyBulkQuotes({ status: status || undefined, size: 30 }).then((d) => pageOf(d).items) });
export const useBulkQuote = (id) => useQuery({ queryKey: ['bulkQuote', id], queryFn: () => api.getBulkQuote(id), enabled: !!id });
const useBulkMutation = (fn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => { qc.invalidateQueries({ queryKey: BULK_KEY }); qc.invalidateQueries({ queryKey: ['bulkQuote'] }); } });
};
export const useCreateBulkQuote = () => useBulkMutation(api.createBulkQuote);
export const useAcceptBulkQuote = () => useBulkMutation(api.acceptBulkQuote);
export const useRejectBulkQuote = () => useBulkMutation(api.rejectBulkQuote);
export const useCancelBulkQuote = () => useBulkMutation(api.cancelBulkQuote);

// Trạng thái báo giá sỉ — nhãn giống web (bulkQuote.status), màu theo Badge của app
export const BULK_STATUS = {
  pending: ['pending', 'Chờ báo giá'], offered: ['neg', 'Đã có báo giá'], accepted: ['closed', 'Đã chấp nhận'],
  rejected: ['rej', 'Đã từ chối'], declined: ['rej', 'NCC từ chối'], cancelled: ['muted', 'Đã huỷ'], expired: ['muted', 'Hết hạn'],
};
export const BULK_TABS = ['', 'pending', 'offered', 'accepted', 'rejected', 'declined', 'cancelled', 'expired'];
// % tiết kiệm so với giá niêm yết (listPrice null = biến thể đã xoá → không so được)
export const savingPercent = (listPrice, unitPrice) => (listPrice > 0 && unitPrice != null ? Math.round(((listPrice - unitPrice) / listPrice) * 100) : null);
