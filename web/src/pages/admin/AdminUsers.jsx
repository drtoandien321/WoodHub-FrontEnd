import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useAdminUsers, useDeleteUser } from '../../hooks/useAdminUsers.js';
import { Eye, Trash } from '../../components/suppliers/icons.jsx';

const ROLE_LABEL = { customer: 'Khách hàng', supplier: 'Nhà cung cấp', admin: 'Quản trị viên' };
const CUSTOMER_TYPE_LABEL = { individual: 'Cá nhân', business: 'Doanh nghiệp' };

/*
 * AdminUsers — danh sách người dùng (GET /users, Pageable). CỐ TÌNH KHÔNG có ô tìm kiếm:
 * BE không hỗ trợ search/filter (chỉ phân trang) — filter client-side trên 1 trang sẽ chỉ lọc
 * được đúng trang đang xem, gây hiểu nhầm là đã lọc toàn bộ dữ liệu.
 * KHÔNG có khoá/mở khoá — BE chưa có API này (xem TestCase.md/ghi chú Pha 0A), chỉ Xem/Sửa/Xoá.
 */
const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const myId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useAdminUsers({ page, size: PAGE_SIZE });
  const deleteUser = useDeleteUser();

  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };

  const handleDelete = (u) => {
    if (u.id === myId) { window.alert('Không thể tự xoá tài khoản đang đăng nhập.'); return; }
    if (!window.confirm(`Xoá tài khoản "${u.email}"? Hành động này không thể hoàn tác.`)) return;
    deleteUser.mutate(u.id, { onError: () => window.alert('Xoá thất bại, vui lòng thử lại') });
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Người dùng</h1>
        <p className="mt-1 text-base-content/60">Xem, sửa và xoá tài khoản người dùng trên hệ thống.</p>
      </header>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Loại KH</th><th>Ngày tạo</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!isLoading && items.map((u) => (
                <tr key={u.id} className="hover:bg-base-200/50">
                  <td><Link to={`/admin/users/${u.id}`} className="font-medium hover:text-primary">{u.email}</Link></td>
                  <td className="text-sm">{u.fullName}</td>
                  <td className="text-sm">{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="text-sm">{CUSTOMER_TYPE_LABEL[u.customerType] ?? '—'}</td>
                  <td className="text-sm text-base-content/60">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/users/${u.id}`} className="btn btn-ghost btn-xs btn-square" aria-label="Xem/Sửa"><Eye width={15} height={15} /></Link>
                      <button onClick={() => handleDelete(u)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !items.length && (
                <tr><td colSpan={6} className="py-10 text-center text-base-content/50">Không có người dùng nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-3 text-sm text-base-content/60">
            <span>Trang {pageInfo.number + 1} / {pageInfo.totalPages} — {pageInfo.totalElements} người dùng</span>
            <div className="join">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageInfo.number === 0} className="btn btn-sm join-item">«</button>
              <button onClick={() => setPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))} disabled={pageInfo.number >= pageInfo.totalPages - 1} className="btn btn-sm join-item">»</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
