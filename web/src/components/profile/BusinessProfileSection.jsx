import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusinessProfile, useSaveBusinessProfile } from '../../hooks/useUser.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { isValidTaxCode } from '../../utils/taxCode.js';

const EMPTY = { companyName: '', taxCode: '', companyAddress: '' };

/*
 * Hồ sơ doanh nghiệp (thông tin xuất hoá đơn VAT) — GET/POST/PUT /users/me/business-profile.
 * Hiện cho MỌI customer:
 *   - đã có hồ sơ → sửa (PUT);
 *   - chưa có → form tạo (POST). Khách cá nhân được báo trước: tạo hồ sơ sẽ CHUYỂN tài khoản sang doanh
 *     nghiệp (BE tự nâng customerType) — trước đây FE không nối API này nên khách doanh nghiệp không có chỗ
 *     nhập MST/tên công ty (lỗi QA 20/10).
 */
export default function BusinessProfileSection({ customerType }) {
  const { t } = useTranslation();
  const { data: profile, isLoading, isError, refetch } = useBusinessProfile();
  const save = useSaveBusinessProfile();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState(''); // chốt lúc submit: sau khi tạo, exists đổi thành true

  const exists = !!profile;
  useEffect(() => {
    if (profile) setForm({ companyName: profile.companyName ?? '', taxCode: profile.taxCode ?? '', companyAddress: profile.companyAddress ?? '' });
  }, [profile]);

  // Link /profile#business (từ trang /b2b): React Router không tự cuộn tới hash → cuộn khi khối đã có nội dung
  useEffect(() => {
    if (!isLoading && window.location.hash === '#business') {
      document.getElementById('business')?.scrollIntoView({ block: 'start' });
    }
  }, [isLoading]);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setSavedMsg(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const body = { companyName: form.companyName.trim(), taxCode: form.taxCode.trim(), companyAddress: form.companyAddress.trim() };
    if (!body.companyName || !body.taxCode || !body.companyAddress) return setError(t('profile.business.required'));
    if (!isValidTaxCode(body.taxCode)) return setError(t('profile.business.taxCodeInvalid'));
    save.mutate(
      { exists, ...body },
      { onSuccess: () => setSavedMsg(exists ? 'profile.business.saved' : 'profile.business.created'), onError: (err) => setError(apiErrorMessage(err, t('profile.business.saveError'))) }
    );
  };

  return (
    <section id="business" className="card scroll-mt-24 bg-base-200 border border-base-300 p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl">{t('profile.business.title')}</h2>
        <p className="text-sm text-base-content/60">{t('profile.business.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : isError ? (
        <p className="text-sm text-error">
          {t('profile.business.loadError')} <button type="button" onClick={() => refetch()} className="link">{t('profile.business.retry')}</button>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {!exists && customerType !== 'business' && (
            <p className="rounded-xl border border-info/30 bg-info/10 p-3 text-sm">{t('profile.business.upgradeNote')}</p>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/60">{t('profile.business.companyName')} *</span>
            <input value={form.companyName} onChange={set('companyName')} maxLength={255} className="input input-bordered w-full" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/60">{t('profile.business.taxCode')} *</span>
            <input value={form.taxCode} onChange={set('taxCode')} maxLength={20} inputMode="numeric" placeholder="0123456789" className="input input-bordered w-full" />
            <span className="text-xs text-base-content/45">{t('profile.business.taxCodeHint')}</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/60">{t('profile.business.companyAddress')} *</span>
            <textarea value={form.companyAddress} onChange={set('companyAddress')} rows={2} className="textarea textarea-bordered w-full" />
          </label>

          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          {savedMsg && <p className="text-sm text-success">{t(savedMsg)}</p>}

          <button className="btn btn-primary self-start" disabled={save.isPending}>
            {save.isPending ? <span className="loading loading-spinner loading-sm" /> : t(exists ? 'profile.business.save' : 'profile.business.create')}
          </button>
        </form>
      )}
    </section>
  );
}
