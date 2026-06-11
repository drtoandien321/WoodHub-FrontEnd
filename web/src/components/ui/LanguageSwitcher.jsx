import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
];

// Toggle VI | EN — i18next-browser-languagedetector tự lưu lựa chọn vào localStorage (key 'woodhub-lang')
export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="flex items-center gap-1 text-sm" role="group" aria-label={t('common.switchLanguage')}>
      {LANGS.map((lang, idx) => (
        <span key={lang.code} className="flex items-center">
          {idx > 0 && <span className="text-base-content/30 mx-1">|</span>}
          <button
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            aria-label={`${t('common.switchLanguage')}: ${lang.label}`}
            className={`px-1 transition-colors ${current === lang.code ? 'font-semibold text-primary' : 'text-base-content/50 hover:text-base-content'}`}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
