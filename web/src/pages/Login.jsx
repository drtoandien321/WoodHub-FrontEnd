import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import { MailIcon, LockIcon } from '../components/ui/icons.jsx';
import { redirectPathForRole } from '../utils/auth.js';

// Chỉ chế độ mock mới cần nút chọn vai trò (để demo nhanh customer/supplier/admin).
// BE thật xác định role từ tài khoản → không cho FE chọn, nên ẩn nút này đi.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login({ ...form, role });
      setAuth({ token, user });
      navigate(redirectPathForRole(user.role, location.state?.from?.pathname), { replace: true });
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

  // Demo: chọn vai trò đăng nhập (BE thật xác định role từ tài khoản, không cho FE chọn)
  const ROLES = [
    ['customer', t('auth.roles.customer')],
    ['supplier', t('auth.roles.supplier')],
    ['admin', t('auth.roles.admin')],
  ];

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl md:text-5xl mb-2">{t('auth.login.title')}</h1>
      <p className="text-base-content/60 mb-7">{t('auth.login.subtitle')}</p>

      

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField icon={MailIcon} type="email" required placeholder={t('auth.login.emailPlaceholder')}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div>
          <AuthField icon={LockIcon} password required minLength={6} placeholder={t('auth.login.passwordPlaceholder')}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="text-right mt-2">
            {/* Chưa có luồng quên mật khẩu — link để sẵn cho V1 */}
            <button type="button" className="text-sm font-medium text-primary hover:underline cursor-pointer">
              {t('auth.login.forgotPassword')}
            </button>
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
