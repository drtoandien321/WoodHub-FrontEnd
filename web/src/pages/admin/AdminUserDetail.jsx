import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useAdminUserDetail, useUpdateAdminUser, useDeleteUser } from '../../hooks/useAdminUsers.js';
import { Trash } from '../../components/suppliers/icons.jsx';

const ROLE_LABEL = { customer: 'Khách hàng', supplier: 'Nhà cung cấp', admin: 'Quản trị viên' };
const CUSTOMER_TYPE_LABEL = { individual: 'Cá nhân', business: 'Doanh nghiệp' };

/*
 * AdminUserDetail — xem + sửa fullName/phone (PUT /users/{id}, tái dùng api.updateUser) + xoá.
 * KHÔNG có đổi mật khẩu hộ / khoá tài khoản — BE không hỗ trợ (xem ghi chú ở AdminUsers.jsx).
 * Email/vai trò/loại KH chỉ hiển thị, không sửa được (đúng UpdateUserRequest của BE).
 */
export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const myId = useAuthStore((s) => s.user?.id);
  const { data: user, isLoading, isError } = useAdminUserDetail(id);
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteUser();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) { setFullName(user.fullName ?? ''); setPhone(user.phone ?? ''); }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <div className="skeleton h-64 rounded-2xl" />;
  if (isError || !user) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-xl">Không tìm thấy người dùng</p>
        <Link to="/admin/users" className="btn btn-primary mt-4">Về danh sách</Link>
      </div>
    );
  }

  const save = async () => {
    setErr(''); setSaved(false);
    if (!fullName.trim()) { setErr('Vui lòng nhập họ tên'); return; }
    try {
      await updateUser.mutateAsync({ id: user.id, fullName: fullName.trim(), phone });
      setSaved(true);
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Không lưu được, vui lòng thử lại');
    }
  };

  const handleDelete = () => {
    if (user.id === myId) { window.alert('Không thể tự xoá tài khoản đang đăng nhập.'); return; }
    if (!window.confirm(`Xoá tài khoản "${user.email}"? Hành động này không thể hoàn tác.`)) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => navigate('/admin/users'),
      onError: () => window.alert('Xoá thất bại, vui lòng thử lại'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-sm text-base-content/55">
        <Link to="/admin/users" className="hover:text-primary">Người dùng</Link>
        <span>/</span><span className="font-medium text-base-content/80">Chi tiết</span>
      </nav>

      <header>
        <h1 className="font-display text-3xl">{user.email}</h1>
        <p className="mt-1 text-base-content/60">{ROLE_LABEL[user.role] ?? user.role} · {CUSTOMER_TYPE_LABEL[user.customerType] ?? '—'}</p>
      </header>

      <section className="max-w-xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg">Thông tin</h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Họ tên</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input input-bordered w-full" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Số điện thoại</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input input-bordered w-full" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Email (không thể sửa)</span>
            <input value={user.email} disabled className="input input-bordered w-full opacity-60" />
          </label>
          {err && <p className="text-xs text-error">{err}</p>}
          {saved && <p className="text-xs text-success">Đã lưu thay đổi.</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={save} disabled={updateUser.isPending} className="btn btn-primary">
              {updateUser.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu thay đổi'}
            </button>
            <button onClick={handleDelete} disabled={deleteUser.isPending} className="btn btn-outline btn-error gap-2">
              <Trash width={16} height={16} /> Xóa tài khoản
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
