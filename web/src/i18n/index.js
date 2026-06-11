import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import vi from './vi.json';
import en from './en.json';

/*
 * Khởi tạo i18next: detector ưu tiên đọc localStorage (key 'woodhub-lang') trước,
 * nếu chưa có thì theo ngôn ngữ trình duyệt, mặc định fallback về 'vi'.
 * load: 'languageOnly' — chuẩn hóa 'vi-VN'/'en-US' từ trình duyệt về 'vi'/'en'
 * vì resources chỉ khai báo 2 mã ngôn ngữ này.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    load: 'languageOnly',
    interpolation: { escapeValue: false }, // React đã tự escape, không cần i18next escape thêm
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'woodhub-lang',
    },
  });

export default i18n;
