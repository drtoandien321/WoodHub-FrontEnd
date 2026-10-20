import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { useChangePassword } from '../../hooks/useUser.js';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

/*
 * Đổi mật khẩu ngay trong Cài đặt portal (PUT /users/{id}/password qua api.changePassword).
 * Bản cũ chỉ có nút "Đổi mật khẩu" không làm gì. Không dẫn sang /change-password vì trang đó là
 * màn bắt buộc cho tài khoản admin tạo (mật khẩu tạm) — chữ nghĩa và luồng điều hướng khác.
 */
export default function ChangePasswordCard() {
  const user = useAuthStore((s) => s.user);
  const changePassword = useChangePassword();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setDone(false); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Khớp ChangePasswordRequest của BE (@Size min = 6)
    if (form.newPassword.length < 6) return setError('Mật khẩu mới cần ít nhất 6 ký tự.');
    if (form.newPassword !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
    changePassword.mutate(
      { id: user.id, currentPassword: form.currentPassword, newPassword: form.newPassword },
      {
        onSuccess: () => { setForm(EMPTY); setDone(true); },
        onError: (err) => setError(err?.response?.data?.message || 'Không đổi được mật khẩu. Kiểm tra lại mật khẩu hiện tại.'),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="font-display text-lg">Đổi mật khẩu</h2>
      <p className="mb-4 text-xs text-base-content/55">Nên dùng mật khẩu mạnh, khác với mật khẩu ở các trang khác.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PasswordField label="Mật khẩu hiện tại" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
        <PasswordField label="Mật khẩu mới" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" />
        <PasswordField label="Nhập lại mật khẩu mới" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
      </div>
      {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
      {done && <p className="mt-3 text-sm text-success">Đã đổi mật khẩu.</p>}
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={!form.currentPassword || !form.newPassword || changePassword.isPending} className="btn btn-primary">
          {changePassword.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Đổi mật khẩu'}
        </button>
      </div>
    </form>
  );
}

function PasswordField({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-base-content/70">{label}</span>
      <input type="password" required className="input input-bordered w-full" {...props} />
    </label>
  );
}
