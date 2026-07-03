import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import { LockIcon } from '../components/ui/icons.jsx';

/*
 * ResetPassword — bước 2 của luồng quên mật khẩu: nhập OTP + mật khẩu mới.
 * Email đến từ location.state (do ForgotPassword truyền qua) — giống pattern VerifyOtp.jsx.
 * Thành công → về /login để đăng nhập lại bằng mật khẩu mới (BE reset-password không trả token).
 */
export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vào thẳng /reset-password mà không có email (vd F5 mất state) → quay lại bước nhập email
  if (!email) {
    return (
      <AuthLayout>
        <div className="text-center flex flex-col gap-4">
          <p className="text-base-content/70">{t('auth.resetPassword.missingEmail')}</p>
          <Link to="/forgot-password" className="btn btn-primary btn-sm mx-auto">{t('auth.forgotPassword.title')}</Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.mismatch'));
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ email, code, newPassword });
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl md:text-5xl mb-2">{t('auth.resetPassword.title')}</h1>
      <p className="text-sm text-base-content/60 mb-6">{t('auth.resetPassword.subtitle', { email })}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          inputMode="numeric"
          maxLength={6}
          required
          placeholder={t('auth.otp.codePlaceholder')}
          className="input input-bordered text-center text-lg tracking-[0.4em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        <AuthField
          icon={LockIcon} password required minLength={6}
          placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        />
        <AuthField
          icon={LockIcon} password required minLength={6}
          placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-error text-sm">{error}</p>}
        <button
          className="h-14 rounded-2xl bg-primary text-primary-content font-medium transition hover:brightness-95 hover:-translate-y-px disabled:opacity-60"
          disabled={loading || code.length !== 6}
        >
          {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.resetPassword.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
