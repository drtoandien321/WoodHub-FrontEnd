import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { requestLocationOnce } from '../services/geolocation.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import { MailIcon, LockIcon } from '../components/ui/icons.jsx';
import { redirectPathForRole } from '../utils/auth.js';

// Chế độ mock: hiện gợi ý 2 tài khoản test (supplier/admin) để demo khi chưa chạy BE.
// BE thật xác định role từ tài khoản → không cần chọn role ở FE.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Role do BE/mock tự xác định (mock: theo email test, mặc định customer) — FE không gửi role
      const { token, refreshToken, user } = await api.login(form);
      setAuth({ token, refreshToken, user });
      // Xin quyền vị trí ngay sau login THẬT (Pha 2 tính năng GPS) — chỉ customer, không chặn
      // navigate() bên dưới (fire-and-forget, xem services/geolocation.js).
      if (user.role === 'customer') requestLocationOnce();
      // Tài khoản supplier do admin tạo (mật khẩu tạm) → ép đổi mật khẩu trước, chưa vào Portal
      navigate(
        user.mustChangePassword ? '/change-password' : redirectPathForRole(user.role, location.state?.from?.pathname, user.supplierType),
        { replace: true }
      );
    } catch (err) {
      // BE trả 403 khi email chưa xác thực → đưa sang màn nhập OTP
      if (err?.response?.status === 403) {
        navigate('/verify-otp', { state: { email: form.email } });
        return;
      }
      setError(t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl md:text-5xl mb-2">{t('auth.login.title')}</h1>
      <p className="text-base-content/60 mb-7">{t('auth.login.subtitle')}</p>

      {/* Demo (mock): gợi ý tài khoản test để đăng nhập supplier/admin khi chưa chạy BE */}
      {USE_MOCK && (
        <div className="text-xs bg-base-200 rounded-xl p-3 mb-5 text-base-content/70 flex flex-col gap-1">
          <p className="font-medium text-base-content/80">{t('auth.login.testAccountsTitle')}</p>
          <p className="text-base-content/50">{t('auth.login.testAccountsHint')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField icon={MailIcon} type="email" required placeholder={t('auth.login.emailPlaceholder')}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div>
          <AuthField icon={LockIcon} password required minLength={6} placeholder={t('auth.login.passwordPlaceholder')}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <button
          className="h-14 rounded-2xl bg-primary text-primary-content font-medium transition hover:brightness-95 hover:-translate-y-px disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.login.submit')}
        </button>
      </form>

      {/* Phân cách + Google */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-base-content/15" />
        <span className="text-xs text-base-content/50">{t('auth.divider')}</span>
        <div className="flex-1 h-px bg-base-content/15" />
      </div>
      <GoogleAuthButton mode="login" />

      <p className="text-sm text-center mt-5 text-base-content/60">
        {t('auth.login.noAccount')} <Link to="/register" className="link link-primary font-medium">{t('auth.login.registerLink')}</Link>
      </p>
    </AuthLayout>
  );
}
