import { useTranslation } from 'react-i18next';

/*
 * Privacy — trang Chính sách bảo mật công khai (/privacy).
 * Link trang này được khai báo ở APKPure / Google Play ("Privacy policy URL") nên phải
 * truy cập được khi CHƯA đăng nhập. Nội dung nằm trong i18n (privacy.*); thông tin liên hệ
 * dùng lại contact.* để đổi một chỗ là trang Liên hệ và trang này cùng cập nhật.
 */
export default function Privacy() {
  const { t } = useTranslation();
  const sections = t('privacy.sections', { returnObjects: true });
  const contacts = [
    { label: t('contact.emailInfo.label'), value: t('contact.emailInfo.value') },
    { label: t('contact.support.label'), value: t('contact.support.value') },
    { label: t('contact.address.label'), value: t('contact.address.value') },
  ];

  return (
    <article className="max-w-3xl mx-auto flex flex-col gap-8 py-4">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl md:text-5xl leading-[1.1]">{t('privacy.title')}</h1>
        <div className="w-16 h-px bg-primary/40" />
        <p className="text-sm text-base-content/70">{t('privacy.updated')}</p>
        <p className="text-base-content/80 leading-relaxed">{t('privacy.intro')}</p>
      </header>

      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-3">
          <h2 className="font-display text-2xl">{s.title}</h2>
          {s.body && <p className="text-base-content/80 leading-relaxed">{s.body}</p>}
          {s.items && (
            <ul className="list-disc pl-5 flex flex-col gap-2 text-base-content/80 leading-relaxed">
              {s.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl">{t('privacy.contactTitle')}</h2>
        <p className="text-base-content/80 leading-relaxed">{t('privacy.contactBody')}</p>
        <dl className="card bg-base-200 border border-base-300 rounded-2xl p-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {contacts.map((c) => (
            <div key={c.label} className="contents">
              <dt className="text-base-content/70">{c.label}</dt>
              <dd className="font-medium break-all">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
