import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupplierStore, useUpdateSupplierStore } from '../../hooks/useSupplier.js';

export default function PortalStore() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierStore();
  const updateStore = useUpdateSupplierStore();
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '', coverUrl: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateStore.mutate(form, { onSuccess: () => setSaved(true) });
  };

  if (isLoading) return <div className="skeleton h-96 rounded-2xl max-w-2xl" />;

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <h1 className="font-display text-2xl md:text-3xl">{t('portal.store.title')}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-base-content/70">{t('portal.store.name')}</span>
          <input className="input input-bordered w-full" value={form.name} onChange={handleChange('name')} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-base-content/70">{t('portal.store.description')}</span>
          <textarea className="textarea textarea-bordered w-full" rows={3} value={form.description} onChange={handleChange('description')} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-base-content/70">{t('portal.store.logoUrl')}</span>
          <input className="input input-bordered w-full" value={form.logoUrl} onChange={handleChange('logoUrl')} />
        </label>
        {form.logoUrl && (
          <div>
            <p className="text-xs text-base-content/60 mb-1">{t('portal.store.logoPreview')}</p>
            <img src={form.logoUrl} alt="logo" className="w-20 h-20 object-cover rounded-xl border border-base-300" />
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-base-content/70">{t('portal.store.coverUrl')}</span>
          <input className="input input-bordered w-full" value={form.coverUrl} onChange={handleChange('coverUrl')} />
        </label>
        {form.coverUrl && (
          <div>
            <p className="text-xs text-base-content/60 mb-1">{t('portal.store.coverPreview')}</p>
            <img src={form.coverUrl} alt="cover" className="w-full max-w-md aspect-[3/1] object-cover rounded-xl border border-base-300" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button className="btn btn-primary btn-sm w-fit" disabled={updateStore.isPending}>
            {updateStore.isPending ? <span className="loading loading-spinner loading-sm" /> : t('portal.store.save')}
          </button>
          {saved && <span className="text-success text-sm">{t('portal.store.saved')}</span>}
        </div>
      </form>
    </div>
  );
}
