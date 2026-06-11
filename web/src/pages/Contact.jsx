import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubmitContact } from '../hooks/useProducts.js';

const EMPTY_FORM = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const { mutateAsync, isPending } = useSubmitContact();
  const { t } = useTranslation();

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = t('contact.errors.name');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t('contact.errors.email');
    if (!form.subject.trim()) next.subject = t('contact.errors.subject');
    if (!form.message.trim()) next.message = t('contact.errors.message');
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await mutateAsync(form);
    setSuccess(true);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="max-w-xl mx-auto py-6 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-3xl">{t('contact.title')}</h1>
        <p className="text-sm text-base-content/60 mt-1">{t('contact.subtitle')}</p>
      </div>

      {success && (
        <div className="alert alert-success">
          <span>{t('contact.success')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <input
            type="text"
            placeholder={t('contact.namePlaceholder')}
            className="input input-bordered w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <input
            type="email"
            placeholder={t('contact.emailPlaceholder')}
            className="input input-bordered w-full"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder={t('contact.subjectPlaceholder')}
            className="input input-bordered w-full"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          {errors.subject && <p className="text-error text-sm mt-1">{errors.subject}</p>}
        </div>

        <div>
          <textarea
            placeholder={t('contact.messagePlaceholder')}
            rows={5}
            className="textarea textarea-bordered w-full"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          {errors.message && <p className="text-error text-sm mt-1">{errors.message}</p>}
        </div>

        <button className="btn btn-primary" disabled={isPending}>
          {isPending ? <span className="loading loading-spinner loading-sm" /> : t('contact.submit')}
        </button>
      </form>
    </div>
  );
}
