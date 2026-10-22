import { useTranslation } from 'react-i18next';
import { useUiStore } from '../../stores/uiStore.js';
import { SunIcon, MoonIcon } from './icons.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import NotificationBell from '../notifications/NotificationBell.jsx';

/*
 * SideRail — cột nút tròn luôn hiển thị ở mép phải màn hình (thay cho FluidMenu cũ).
 * Chỉ còn 3 chức năng theo yêu cầu: đổi theme (màu nền), đổi ngôn ngữ VI/EN, và thông báo (chuông thật — BE-12).
 * Đăng nhập/đăng ký đã chuyển lên navbar nên không còn ở đây nữa.
 */
const railBtn =
  'w-11 h-11 rounded-full bg-base-100/90 backdrop-blur border border-base-300 shadow-sm flex items-center justify-center text-base-content/80 hover:text-base-content hover:bg-base-100 transition-colors cursor-pointer';

export default function SideRail() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useUiStore();
  const token = useAuthStore((st) => st.token);

  const isDark = theme === 'woodhub-dark';
  const currentLang = (i18n.resolvedLanguage ?? 'vi').toUpperCase();
  const nextLang = i18n.resolvedLanguage === 'vi' ? 'en' : 'vi';

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

      {/* Thông báo (BE-12) — chỉ khi đã đăng nhập; panel mở sang TRÁI nút để không tràn mép phải màn hình */}
      {token && <NotificationBell buttonClassName={railBtn} align="left-of" />}
    </div>
  );
}
