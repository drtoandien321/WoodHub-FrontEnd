import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

// Trang đích sau khi đăng nhập, theo role — supplier/admin vào portal riêng,
// customer quay lại trang đã định vào trước khi bị ProtectedRoute chặn (state.from)
const redirectPathForRole = (role, fromPath) => {
  if (role === 'supplier') return '/portal';
  if (role === 'admin') return '/admin';
  return fromPath ?? '/';
};

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
    } catch {
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
    <div className="max-w-sm mx-auto py-10">
      <h1 className="font-display text-3xl mb-6 text-center">{t('auth.login.title')}</h1>

      <div className="mb-4">
        <p className="text-xs text-base-content/60 mb-2">{t('auth.login.selectRole')}</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setRole(value)} className={`btn btn-sm ${role === value ? 'btn-primary' : 'btn-outline'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="email" required placeholder={t('auth.login.emailPlaceholder')} className="input input-bordered" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" required minLength={6} placeholder={t('auth.login.passwordPlaceholder')} className="input input-bordered" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-error text-sm">{error}</p>}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.login.submit')}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-base-content/60">
        {t('auth.login.noAccount')} <Link to="/register" className="link link-primary">{t('auth.login.registerLink')}</Link>
      </p>
      <p className="text-xs text-center mt-2 text-base-content/40">{t('auth.login.demoNote')}</p>
    </div>
  );
}
