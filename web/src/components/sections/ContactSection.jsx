import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubmitContact } from '../../hooks/useProducts.js';
import { apiErrorMessage } from '../../utils/apiError.js';

const EMPTY_FORM = { name: '', email: '', phone: '', subject: '', message: '' };
// Khớp validate của BE (ContactRequest): số, khoảng trắng, + - ( ) . — tối đa 20 ký tự
const PHONE_RE = /^[0-9 +\-().]{1,20}$/;

/*
 * ContactSection — phần "Liên hệ" 2 cột (form trái + thẻ thông tin phải), dùng lại
 * ở trang /contact lẫn trang gộp /about.
 *
 * Gửi THẬT qua POST /contact (BE-06) — trước đây submitContact chỉ là mock (trả ok, không lưu đâu cả) nên
 * liên hệ của khách bị mất. Lỗi BE: 400 theo field → hiện dưới từng ô; 429 (quá 5 lần/giờ) → hiện câu của BE.
 */
// standalone: trang /contact đứng riêng → tiêu đề là h1 (QA BUG-005); trong /about (đã có h1) giữ h2
export default function ContactSection({ standalone = false }) {
  const Title = standalone ? 'h1' : 'h2';
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { mutateAsync, isPending } = useSubmitContact();
  const { t } = useTranslation();

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = t('contact.errors.name');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t('contact.errors.email');
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) next.phone = t('contact.errors.phone');
    if (!form.subject.trim()) next.subject = t('contact.errors.subject');
    if (!form.message.trim()) next.message = t('contact.errors.message');
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setSubmitError('');
    if (Object.keys(next).length > 0) return;
    try {
      await mutateAsync({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined,
        subject: form.subject.trim(), message: form.message.trim(),
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors) setErrors(fieldErrors);
      setSuccess(false);
      setSubmitError(apiErrorMessage(err, t('contact.sendFailed')));
    }
  };

  const infoCards = [
    t('contact.support', { returnObjects: true }),
    t('contact.emailInfo', { returnObjects: true }),
    t('contact.address', { returnObjects: true }),
  ];

  return (
    <section className="grid md:grid-cols-2 gap-8">
      {/* Cột trái: tiêu đề + form */}
      <div>
        <Title className="font-display text-3xl mb-2">{t('contact.title')}</Title>
        <p className="text-sm text-base-content/70 mb-5 max-w-md">{t('contact.subtitle')}</p>

        {success && (
          <div className="alert alert-success mb-4">
            <span>{t('contact.success')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <input type="text" aria-label={t('contact.namePlaceholder')} placeholder={t('contact.namePlaceholder')} className="input input-bordered w-full"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <input type="email" aria-label={t('contact.emailPlaceholder')} placeholder={t('contact.emailPlaceholder')} className="input input-bordered w-full"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          <div>
            <input type="tel" aria-label={t('contact.phonePlaceholder')} placeholder={t('contact.phonePlaceholder')} className="input input-bordered w-full"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <p className="text-error text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <input type="text" aria-label={t('contact.subjectPlaceholder')} placeholder={t('contact.subjectPlaceholder')} className="input input-bordered w-full"
              value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            {errors.subject && <p className="text-error text-sm mt-1">{errors.subject}</p>}
          </div>

          <div>
            <textarea aria-label={t('contact.messagePlaceholder')} placeholder={t('contact.messagePlaceholder')} rows={5} className="textarea textarea-bordered w-full"
              value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            {errors.message && <p className="text-error text-sm mt-1">{errors.message}</p>}
          </div>

          {submitError && <p role="alert" className="text-error text-sm">{submitError}</p>}
          <button className="btn btn-primary" disabled={isPending}>
            {isPending ? <span className="loading loading-spinner loading-sm" /> : t('contact.submit')}
          </button>
        </form>
      </div>

      {/* Cột phải: 3 thẻ thông tin liên hệ + 1 khối trang trí */}
      <div className="flex flex-col gap-4">
        {infoCards.map((c) => (
          <div key={c.label} className="card bg-base-200 border border-base-300 rounded-2xl px-5 py-4">
            <p className="text-sm text-base-content/70">{c.label}</p>
            <p className="font-medium mt-1">{c.value}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-base-300 flex-1 min-h-36 overflow-hidden">
          <img src="/about/about-3.webp" alt="" className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
}
