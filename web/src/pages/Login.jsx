import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

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
      const { token, user } = await api.login(form);
      setAuth({ token, user });
      // Quay lại trang user định vào trước khi bị chặn (ProtectedRoute đã lưu vào state.from)
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch {
      setError(t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="font-display text-3xl mb-6 text-center">{t('auth.login.title')}</h1>
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
