import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({ name: '', email: '', password: '', workshopName: '', workshopAddress: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { ...form, role, supplierInfo: role === 'supplier' ? { name: form.workshopName, address: form.workshopAddress } : undefined };
      const { token, user } = await api.register(body);
      setAuth({ token, user });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    ['customer', t('auth.register.roleCustomer')],
    ['supplier', t('auth.register.roleSupplier')],
  ];

  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="font-display text-3xl mb-6 text-center">{t('auth.register.title')}</h1>

      {/* RoleSelector: chọn loại tài khoản trước, form đổi theo */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ROLES.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setRole(value)} className={`btn btn-sm ${role === value ? 'btn-primary' : 'btn-outline'}`}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input required placeholder={t('auth.register.namePlaceholder')} className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="email" required placeholder={t('auth.register.emailPlaceholder')} className="input input-bordered" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" required minLength={6} placeholder={t('auth.register.passwordPlaceholder')} className="input input-bordered" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {role === 'supplier' && (
          <>
            <input required placeholder={t('auth.register.workshopNamePlaceholder')} className="input input-bordered" value={form.workshopName} onChange={(e) => setForm({ ...form, workshopName: e.target.value })} />
            <input required placeholder={t('auth.register.workshopAddressPlaceholder')} className="input input-bordered" value={form.workshopAddress} onChange={(e) => setForm({ ...form, workshopAddress: e.target.value })} />
          </>
        )}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.register.submit')}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-base-content/60">
        {t('auth.register.haveAccount')} <Link to="/login" className="link link-primary">{t('auth.register.loginLink')}</Link>
      </p>
    </div>
  );
}
