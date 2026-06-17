import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../../stores/uiStore.js';
import { SunIcon, MoonIcon } from './icons.jsx';

const BellIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/*
 * SideRail — cột nút tròn luôn hiển thị ở mép phải màn hình (thay cho FluidMenu cũ).
 * Chỉ còn 3 chức năng theo yêu cầu: đổi theme (màu nền), đổi ngôn ngữ VI/EN, và thông báo.
 * Đăng nhập/đăng ký đã chuyển lên navbar nên không còn ở đây nữa.
 */
const railBtn =
  'w-11 h-11 rounded-full bg-base-100/90 backdrop-blur border border-base-300 shadow-sm flex items-center justify-center text-base-content/80 hover:text-base-content hover:bg-base-100 transition-colors cursor-pointer';

export default function SideRail() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useUiStore();
  const [notiOpen, setNotiOpen] = useState(false);
  const notiRef = useRef(null);

  const isDark = theme === 'woodhub-dark';
  const currentLang = (i18n.resolvedLanguage ?? 'vi').toUpperCase();
  const nextLang = i18n.resolvedLanguage === 'vi' ? 'en' : 'vi';

  // Đóng panel thông báo khi click ra ngoài
  useEffect(() => {
    if (!notiOpen) return;
    const onClickOutside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setNotiOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [notiOpen]);

  return (
    <div className="fixed right-3 md:right-5 top-[38%] -translate-y-1/2 z-40 flex flex-col gap-3">
      {/* Đổi theme sáng/tối */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? t('common.switchToLight') : t('common.switchToDark')}
        title={isDark ? t('common.switchToLight') : t('common.switchToDark')}
        className={railBtn}
      >
        {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>

      {/* Đổi ngôn ngữ VI/EN — hiển thị mã ngôn ngữ hiện tại, bấm để đổi sang ngôn ngữ còn lại */}
      <button
        type="button"
        onClick={() => i18n.changeLanguage(nextLang)}
        aria-label={t('common.switchLanguage')}
        title={t('common.switchLanguage')}
        className={`${railBtn} text-xs font-semibold`}
      >
        {currentLang}
      </button>

      {/* Thông báo — bấm mở panel placeholder "chưa có thông báo" */}
      <div ref={notiRef} className="relative">
        <button
          type="button"
          onClick={() => setNotiOpen((v) => !v)}
          aria-label={t('common.notifications')}
          aria-expanded={notiOpen}
          title={t('common.notifications')}
          className={railBtn}
        >
          <BellIcon className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {notiOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 8 }}
              transition={{ duration: 0.15 }}
              // Panel mở sang TRÁI của nút (right-full) để không tràn ra ngoài mép màn hình
              className="absolute right-full top-0 mr-3 w-60 origin-top-right rounded-2xl bg-base-100 border border-base-300 shadow-xl p-4"
            >
              <p className="font-medium text-sm mb-2 text-base-content">{t('common.notifications')}</p>
              <p className="text-sm text-base-content/50 py-6 text-center">{t('common.noNotifications')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
