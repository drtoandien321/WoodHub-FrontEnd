import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { SunIcon, MoonIcon } from './icons.jsx';

const PlusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const GlobeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
  </svg>
);
const CartIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const LoginIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5M15 12H3" />
  </svg>
);
const LogoutIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);
const UserPlusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

const ITEM_GAP = 60; // khoảng cách (px) giữa tâm các item, theo chiều dọc xuống dưới FAB

/*
 * FluidMenu — nút tròn nổi (FAB) ở góc phải, bấm vào "nở" thành các item tròn xếp dọc
 * theo hiệu ứng gooey (2 vòng tròn lại gần nhau thì dính/chảy vào nhau như chất lỏng).
 * Cách làm: render 2 lớp chồng nhau cùng vị trí —
 *  - Lớp "blob" (filter: url(#woodhub-goo)) chỉ vẽ các khối tròn màu primary để tạo hiệu ứng dính.
 *  - Lớp "content" (không filter, để icon không bị mờ) vẽ icon + xử lý click, đặt đè lên lớp blob.
 */
export default function FluidMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const isDark = theme === 'woodhub-dark';
  const nextLang = i18n.resolvedLanguage === 'vi' ? 'en' : 'vi';

  const items = [
    {
      key: 'theme',
      icon: isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />,
      label: isDark ? t('common.switchToLight') : t('common.switchToDark'),
      onClick: toggleTheme,
    },
    {
      key: 'lang',
      icon: <GlobeIcon className="w-5 h-5" />,
      label: nextLang.toUpperCase(),
      onClick: () => i18n.changeLanguage(nextLang),
    },
    ...(user
      ? [
          { key: 'cart', icon: <CartIcon className="w-5 h-5" />, label: t('nav.cart'), onClick: () => navigate('/cart') },
          { key: 'logout', icon: <LogoutIcon className="w-5 h-5" />, label: t('nav.logout'), onClick: () => logout() },
        ]
      : [
          { key: 'login', icon: <LoginIcon className="w-5 h-5" />, label: t('nav.login'), onClick: () => navigate('/login') },
          { key: 'register', icon: <UserPlusIcon className="w-5 h-5" />, label: t('nav.register'), onClick: () => navigate('/register') },
        ]),
  ];

  const handleItemClick = (item) => {
    item.onClick();
    setOpen(false);
  };

  return (
    <div ref={ref} className="fixed top-20 right-4 md:top-24 md:right-6 z-40 w-12 h-12">
      {/* SVG filter goo — width/height=0 để không chiếm layout, chỉ định nghĩa filter */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="woodhub-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Lớp blob: tạo hiệu ứng dính giữa FAB và các item khi mở */}
      <div className="absolute inset-0" style={{ filter: 'url(#woodhub-goo)' }}>
        <div className="absolute top-0 right-0 w-12 h-12 rounded-full bg-primary" />
        <AnimatePresence>
          {open && items.map((item, i) => (
            <motion.div
              key={item.key}
              className="absolute top-0 right-0 w-12 h-12 rounded-full bg-primary"
              initial={{ scale: 0, y: 0 }}
              animate={{ scale: 1, y: (i + 1) * ITEM_GAP }}
              exit={{ scale: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.04 }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Lớp content: icon sắc nét + click handler, không bị filter goo làm mờ */}
      <div className="absolute inset-0">
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t('common.toggleMenu')}
          className="absolute top-0 right-0 w-12 h-12 rounded-full flex items-center justify-center text-primary-content cursor-pointer"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <PlusIcon className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {open && items.map((item, i) => (
            <motion.button
              key={item.key}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => handleItemClick(item)}
              className="absolute top-0 right-0 w-12 h-12 rounded-full flex items-center justify-center text-primary-content cursor-pointer"
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{ scale: 1, opacity: 1, y: (i + 1) * ITEM_GAP }}
              exit={{ scale: 0, opacity: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.04 }}
            >
              {item.icon}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
