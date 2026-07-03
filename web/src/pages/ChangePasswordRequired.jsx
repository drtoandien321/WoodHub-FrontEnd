import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore.js';
import { useChangePassword } from '../hooks/useUser.js';
import { useLogout } from '../hooks/useLogout.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import { LockIcon } from '../components/ui/icons.jsx';
import { redirectPathForRole } from '../utils/auth.js';

/*
 * ChangePasswordRequired — chặn bắt buộc cho tài khoản supplier do admin tạo
 * (user.mustChangePassword=true). ProtectedRoute (routes/ProtectedRoute.jsx) redirect thẳng
 * vào đây trước khi cho vào bất kỳ trang cần đăng nhập nào — không có Header/menu để tránh
 * người dùng "lách" sang trang khác (route guard chặn thật, đây chỉ là UI hỗ trợ).
 *
 * currentPassword ở đây chính là mật khẩu tạm BE gửi qua email lúc admin tạo tài khoản.
 */
export default function ChangePasswordRequired() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearMustChangePassword = useAuthStore((s) => s.clearMustChangePassword);
  const logout = useLogout();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('auth.changePasswordRequired.mismatch'));
      return;
    }
    try {
      await changePassword.mutateAsync({ id: user.id, currentPassword, newPassword });
      clearMustChangePassword();
      navigate(redirectPathForRole(user.role, undefined, user.supplierType), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.changePasswordRequired.error'));
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl md:text-5xl mb-2">{t('auth.changePasswordRequired.title')}</h1>
      <p className="text-base-content/60 mb-7">{t('auth.changePasswordRequired.subtitle')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          icon={LockIcon} password required minLength={6}
          placeholder={t('auth.changePasswordRequired.currentPasswordPlaceholder')}
          value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <AuthField
          icon={LockIcon} password required minLength={6}
          placeholder={t('auth.changePasswordRequired.newPasswordPlaceholder')}
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        />
        <AuthField
          icon={LockIcon} password required minLength={6}
          placeholder={t('auth.changePasswordRequired.confirmPasswordPlaceholder')}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-error text-sm">{error}</p>}
        <button
          className="h-14 rounded-2xl bg-primary text-primary-content font-medium transition hover:brightness-95 hover:-translate-y-px disabled:opacity-60"
          disabled={changePassword.isPending}
        >
          {changePassword.isPending ? <span className="loading loading-spinner loading-sm" /> : t('auth.changePasswordRequired.submit')}
        </button>
      </form>

      <p className="text-sm text-center mt-5 text-base-content/60">
        <button type="button" onClick={logout} className="link link-primary font-medium">
          {t('auth.changePasswordRequired.logout')}
        </button>
      </p>
    </AuthLayout>
  );
}
