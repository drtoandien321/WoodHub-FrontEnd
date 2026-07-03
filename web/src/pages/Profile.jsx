import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore.js';
import { useMe, useUpdateUser, useChangePassword } from '../hooks/useUser.js';

/*
 * Profile — trang "Thông tin cá nhân" mở từ dropdown tài khoản trên Header.
 * - Gọi GET /users/me (useMe) để lấy dữ liệu mới nhất thay vì chỉ đọc snapshot lúc login.
 * - Cho sửa fullName/phone (PUT /users/{id}) — BE KHÔNG cho đổi email qua endpoint này.
 * - Đổi mật khẩu tự nguyện (khác ChangePasswordRequired.jsx — trang đó là BẮT BUỘC, không có
 *   nút bỏ qua; ở đây chỉ là tiện ích tự chọn).
 */
export default function Profile() {
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const { data: me, isLoading } = useMe();
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();

  // ProtectedRoute đã chặn khách chưa đăng nhập; phòng hờ trả null nếu chưa có user
  if (!authUser) return null;

  return (
    <div className="max-w-xl mx-auto py-10 px-4 flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl mb-6">{t('profile.title')}</h1>
        {isLoading ? (
          <div className="skeleton h-40 rounded-2xl" />
        ) : (
          <ProfileForm me={me ?? authUser} onSave={updateUser} />
        )}
      </div>

      <ChangePasswordSection onSubmit={changePassword} />
    </div>
  );
}

function ProfileForm({ me, onSave }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(me.fullName ?? me.name ?? '');
  const [phone, setPhone] = useState(me.phone ?? '');
  const [saved, setSaved] = useState(false);

  // Đồng bộ form khi query trả dữ liệu mới (vd sau khi F5 và GET /users/me xong)
  useEffect(() => {
    setFullName(me.fullName ?? me.name ?? '');
    setPhone(me.phone ?? '');
  }, [me.fullName, me.name, me.phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaved(false);
    await onSave.mutateAsync({ id: me.id, fullName, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-base-200 border border-base-300 p-5 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-base-content/60">{t('profile.name')}</span>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input input-bordered w-full"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-base-content/60">{t('profile.phone')}</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input input-bordered w-full"
        />
      </label>
      {/* Email/role chỉ đọc — BE không cho đổi email qua PUT /users/{id} */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <span className="text-sm text-base-content/60">{t('profile.email')}</span>
        <span className="font-medium text-sm">{me.email}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-base-content/60">{t('profile.role')}</span>
        <span className="font-medium text-sm">{t(`auth.roles.${me.role}`)}</span>
      </div>

      {onSave.isError && <p className="text-error text-sm">{t('profile.saveError')}</p>}
      <button className="btn btn-primary self-start" disabled={onSave.isPending}>
        {onSave.isPending ? <span className="loading loading-spinner loading-sm" /> : saved ? t('profile.saved') : t('profile.save')}
      </button>
    </form>
  );
}

function ChangePasswordSection({ onSubmit }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const authUser = useAuthStore((s) => s.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }
    try {
      await onSubmit.mutateAsync({ id: authUser.id, currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || t('profile.passwordError'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-base-200 border border-base-300 p-5 flex flex-col gap-4">
      <h2 className="font-display text-xl">{t('profile.changePasswordTitle')}</h2>
      <input
        type="password" required minLength={6}
        placeholder={t('profile.currentPasswordPlaceholder')}
        value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
        className="input input-bordered w-full"
      />
      <input
        type="password" required minLength={6}
        placeholder={t('profile.newPasswordPlaceholder')}
        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        className="input input-bordered w-full"
      />
      <input
        type="password" required minLength={6}
        placeholder={t('profile.confirmPasswordPlaceholder')}
        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
        className="input input-bordered w-full"
      />
      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">{t('profile.passwordChanged')}</p>}
      <button className="btn btn-outline self-start" disabled={onSubmit.isPending}>
        {onSubmit.isPending ? <span className="loading loading-spinner loading-sm" /> : t('profile.changePasswordSubmit')}
      </button>
    </form>
  );
}
