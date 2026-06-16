import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();

  // Vào từ nút "Đăng ký tài khoản doanh nghiệp" của trang B2B → /register?type=business
  // Khi đó hiện form DOANH NGHIỆP riêng, ẩn lựa chọn role (Khách hàng / Xưởng).
  const [searchParams] = useSearchParams();
  const isBusiness = searchParams.get('type') === 'business';

  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    workshopName: '', workshopAddress: '',
    companyName: '', taxCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // B2B là bên MUA số lượng lớn → vẫn dùng role 'customer' (có giỏ hàng/đơn hàng),
      // chỉ khác là gắn thêm businessInfo và hiển thị tên doanh nghiệp.
      const body = isBusiness
        ? {
            name: form.companyName,
            email: form.email,
            password: form.password,
            role: 'customer',
            businessInfo: { companyName: form.companyName, contactName: form.name, taxCode: form.taxCode },
          }
        : {
            ...form,
            role,
            supplierInfo: role === 'supplier' ? { name: form.workshopName, address: form.workshopAddress } : undefined,
          };
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
      <h1 className={`font-display text-3xl text-center ${isBusiness ? 'mb-2' : 'mb-6'}`}>
        {isBusiness ? t('auth.register.businessTitle') : t('auth.register.title')}
      </h1>
      {isBusiness && (
        <p className="text-sm text-center text-base-content/60 mb-6">{t('auth.register.businessSubtitle')}</p>
      )}

      {/* RoleSelector chỉ hiện ở đăng ký thường — đăng ký doanh nghiệp không cho chọn role */}
      {!isBusiness && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {ROLES.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setRole(value)} className={`btn btn-sm ${role === value ? 'btn-primary' : 'btn-outline'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isBusiness ? (
          <>
            <input required placeholder={t('auth.register.companyNamePlaceholder')} className="input input-bordered" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <input required placeholder={t('auth.register.contactNamePlaceholder')} className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" required placeholder={t('auth.register.emailPlaceholder')} className="input input-bordered" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" required minLength={6} placeholder={t('auth.register.passwordPlaceholder')} className="input input-bordered" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input required placeholder={t('auth.register.taxCodePlaceholder')} className="input input-bordered" value={form.taxCode} onChange={(e) => setForm({ ...form, taxCode: e.target.value })} />
          </>
        ) : (
          <>
            <input required placeholder={t('auth.register.namePlaceholder')} className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" required placeholder={t('auth.register.emailPlaceholder')} className="input input-bordered" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" required minLength={6} placeholder={t('auth.register.passwordPlaceholder')} className="input input-bordered" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {role === 'supplier' && (
              <>
                <input required placeholder={t('auth.register.workshopNamePlaceholder')} className="input input-bordered" value={form.workshopName} onChange={(e) => setForm({ ...form, workshopName: e.target.value })} />
                <input required placeholder={t('auth.register.workshopAddressPlaceholder')} className="input input-bordered" value={form.workshopAddress} onChange={(e) => setForm({ ...form, workshopAddress: e.target.value })} />
              </>
            )}
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
