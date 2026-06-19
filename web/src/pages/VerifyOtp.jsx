import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import { redirectPathForRole } from '../utils/auth.js';

/*
 * VerifyOtp — màn nhập mã OTP xác thực email (luồng mới của BE).
 * Đến từ: Register (sau khi đăng ký) hoặc Login (khi BE báo email chưa xác thực 403).
 * Email truyền qua location.state.email. Xác thực OK → BE trả token → đăng nhập luôn.
 */
export default function VerifyOtp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // đếm ngược giây trước khi cho gửi lại

  // Bộ đếm ngược cho nút "Gửi lại mã" (BE giới hạn 60s)
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Vào thẳng /verify-otp mà không có email (vd F5 mất state) → quay lại đăng ký
  if (!email) {
    return (
      <AuthLayout>
        <div className="text-center flex flex-col gap-4">
          <p className="text-base-content/70">{t('auth.otp.missingEmail')}</p>
          <Link to="/register" className="btn btn-primary btn-sm mx-auto">{t('auth.register.title')}</Link>
        </div>
      </AuthLayout>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.verifyOtp({ email, code });
      setAuth({ token, user });
      navigate(redirectPathForRole(user.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.otp.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      await api.resendOtp({ email });
      setInfo(t('auth.otp.resent'));
      setCooldown(60);
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.google.error'));
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl md:text-5xl mb-2">{t('auth.otp.title')}</h1>
      <p className="text-sm text-base-content/60 mb-6">{t('auth.otp.subtitle', { email })}</p>

      {info && <div className="alert alert-success mb-4"><span>{info}</span></div>}

      <form onSubmit={handleVerify} className="flex flex-col gap-3">
        <input
          inputMode="numeric"
          maxLength={6}
          required
          placeholder={t('auth.otp.codePlaceholder')}
          className="input input-bordered text-center text-lg tracking-[0.4em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        {error && <p className="text-error text-sm">{error}</p>}
        <button className="btn btn-primary" disabled={loading || code.length !== 6}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.otp.submit')}
        </button>
      </form>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="link link-primary text-sm disabled:no-underline disabled:text-base-content/40 disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? t('auth.otp.resendIn', { seconds: cooldown }) : t('auth.otp.resend')}
        </button>
      </div>
    </AuthLayout>
  );
}
