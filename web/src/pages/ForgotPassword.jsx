import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import { MailIcon } from '../components/ui/icons.jsx';

/*
 * ForgotPassword — bước 1 của luồng quên mật khẩu: nhập email → BE gửi OTP đặt lại mật khẩu.
 * Thành công → sang /reset-password mang theo email (giống Register → VerifyOtp).
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl md:text-5xl mb-2">{t('auth.forgotPassword.title')}</h1>
      <p className="text-base-content/60 mb-7">{t('auth.forgotPassword.subtitle')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          icon={MailIcon} type="email" required
          placeholder={t('auth.forgotPassword.emailPlaceholder')}
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="text-error text-sm">{error}</p>}
        <button
          className="h-14 rounded-2xl bg-primary text-primary-content font-medium transition hover:brightness-95 hover:-translate-y-px disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.forgotPassword.submit')}
        </button>
      </form>

      <p className="text-sm text-center mt-5 text-base-content/60">
        <Link to="/login" className="link link-primary font-medium">{t('auth.forgotPassword.backToLogin')}</Link>
      </p>
    </AuthLayout>
  );
}
