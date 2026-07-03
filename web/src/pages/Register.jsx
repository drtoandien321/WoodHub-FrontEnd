import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import { UserIcon, MailIcon, PhoneIcon, LockIcon, BuildingIcon } from '../components/ui/icons.jsx';

/*
 * Register — CHỈ đăng ký khách hàng (customer). BE luôn tạo role=customer + yêu cầu xác thực email.
 * Luồng: submit → BE gửi OTP → chuyển /verify-otp (không auto-login).
 *
 * Biến thể ?type=business: customerType='business' + 3 field doanh nghiệp (companyName/taxCode/
 * companyAddress) gửi kèm — BE validate các field này là bắt buộc khi customerType=business
 * (không phải ở DTO, nên FE tự đánh dấu required trên UI cho rõ ràng).
 * ⚠️ Trước đây field "name" bị dùng lẫn lộn làm cả tên người lẫn tên công ty tuỳ biến thể —
 * đã tách rõ: "name" LUÔN là họ tên người đăng ký (BE yêu cầu fullName ở mọi trường hợp),
 * "companyName" là field RIÊNG chỉ hiện khi đăng ký doanh nghiệp.
 */
export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isBusiness = searchParams.get('type') === 'business';

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    companyName: '', taxCode: '', companyAddress: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        customerType: isBusiness ? 'business' : 'individual',
        ...(isBusiness && {
          companyName: form.companyName,
          taxCode: form.taxCode,
          companyAddress: form.companyAddress,
        }),
      };
      await api.register(body);
      // register KHÔNG còn trả token — sang màn nhập OTP, mang theo email
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl md:text-5xl mb-2">
        {isBusiness ? t('auth.register.businessTitle') : t('auth.register.title')}
      </h1>
      <p className="text-base-content/60 mb-7">
        {isBusiness ? t('auth.register.businessSubtitle') : t('auth.register.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          icon={UserIcon}
          required
          placeholder={t('auth.register.namePlaceholder')}
          value={form.name}
          onChange={set('name')}
        />
        <AuthField icon={MailIcon} type="email" required placeholder={t('auth.register.emailPlaceholder')} value={form.email} onChange={set('email')} />
        <AuthField icon={PhoneIcon} type="tel" required placeholder={t('auth.register.phonePlaceholder')} value={form.phone} onChange={set('phone')} />
        <AuthField icon={LockIcon} password required minLength={6} placeholder={t('auth.register.passwordPlaceholder')} value={form.password} onChange={set('password')} />

        {/* Chỉ hiện khi đăng ký doanh nghiệp (?type=business) — gửi kèm customerType='business' */}
        {isBusiness && (
          <>
            <div className="divider my-0 text-xs text-base-content/40">{t('auth.register.businessSectionTitle')}</div>
            <AuthField icon={BuildingIcon} required placeholder={t('auth.register.companyNamePlaceholder')} value={form.companyName} onChange={set('companyName')} />
            <AuthField icon={BuildingIcon} placeholder={t('auth.register.taxCodePlaceholder')} value={form.taxCode} onChange={set('taxCode')} />
            <AuthField icon={BuildingIcon} placeholder={t('auth.register.companyAddressPlaceholder')} value={form.companyAddress} onChange={set('companyAddress')} />
          </>
        )}

        {error && <p className="text-error text-sm">{error}</p>}
        <button
          className="h-14 rounded-2xl bg-primary text-primary-content font-medium transition hover:brightness-95 hover:-translate-y-px disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.register.submit')}
        </button>
      </form>

      {/* Phân cách + Google */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-base-content/15" />
        <span className="text-xs text-base-content/50">{t('auth.divider')}</span>
        <div className="flex-1 h-px bg-base-content/15" />
      </div>
      <GoogleAuthButton mode="register" />

      <p className="text-sm text-center mt-5 text-base-content/60">
        {t('auth.register.haveAccount')} <Link to="/login" className="link link-primary font-medium">{t('auth.register.loginLink')}</Link>
      </p>
    </AuthLayout>
  );
}
