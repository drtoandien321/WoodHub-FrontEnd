import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks xử lý đơn cho portal — dùng chung 1 bộ cho 2 phạm vi:
 *  - 'supplier' → /supplier/orders (chỉ đơn của nhà cung cấp đang đăng nhập)
 *  - 'admin'    → /admin/orders   (mọi đơn)
 * Truyền `scope` thay vì viết 2 bộ hook giống hệt nhau — trang đơn hàng supplier và admin cũng dùng
 * chung 1 component (components/orders/OrderManagement.jsx).
 */
const API = {
  supplier: { list: api.getSupplierOrders, update: api.updateSupplierOrderStatus },
  admin: { list: api.getAdminOrders, update: api.updateAdminOrderStatus },
};

export const managedOrdersKey = (scope) => ['managedOrders', scope];

export const useManagedOrders = (scope, params) =>
  useQuery({
    queryKey: [...managedOrdersKey(scope), params],
    queryFn: () => API[scope].list(params),
    placeholderData: (prev) => prev, // giữ trang cũ khi chuyển tab/trang → không nháy skeleton
  });

// body: { id, status, note? } — thành công thì làm mới danh sách (đơn có thể rời khỏi tab đang lọc)
export const useUpdateOrderStatus = (scope) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: API[scope].update,
    onSuccess: () => qc.invalidateQueries({ queryKey: managedOrdersKey(scope) }),
  });
};

// NCC ghi nhận đã xuất hoá đơn VAT (BE-08 §4.3): { id, invoiceNumber, invoiceUrl? }
export const useMarkVatIssued = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.markVatIssued, onSuccess: () => qc.invalidateQueries({ queryKey: managedOrdersKey('supplier') }) });
};
