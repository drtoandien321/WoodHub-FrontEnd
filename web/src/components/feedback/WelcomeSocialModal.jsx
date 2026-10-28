import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalShell from '../admin/ModalShell.jsx';
import { Star } from '../suppliers/icons.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { useFeedbackStore } from '../../stores/feedbackStore.js';
import { useMyPlatformFeedback, FEEDBACK_ENABLED, FEEDBACK_REWARD } from '../../hooks/usePlatformFeedback.js';
import { SOCIAL_LINKS } from '../../utils/socialLinks.js';

const FacebookIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);
const TiktokIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.04.86.12V9.4a6.34 6.34 0 0 0-1-.08A6.34 6.34 0 1 0 15.82 15.66V8.67a8.16 8.16 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06z" />
  </svg>
);

/*
 * Popup chào mừng NGAY SAU KHI ĐĂNG NHẬP: mời theo dõi Facebook / TikTok của WoodHub + mời đánh giá web.
 * Gắn 1 lần ở App.jsx. Chỉ bật khi user đổi từ "chưa đăng nhập" → "đã đăng nhập" trong phiên đang mở (đăng nhập
 * mật khẩu, Google hay xác thực OTP đều đi qua setAuth) — F5 với phiên cũ (store đã có user từ localStorage lúc tải
 * trang) thì KHÔNG bật, để không làm phiền mỗi lần mở web.
 * Bỏ qua admin (không tự đánh giá sàn) và tài khoản phải đổi mật khẩu lần đầu (đang bị chuyển sang trang đổi mật khẩu).
 */
export default function WelcomeSocialModal() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const openFeedback = useFeedbackStore((s) => s.openFeedback);
  const [open, setOpen] = useState(false);
  const prevUserId = useRef(user?.id ?? null);

  useEffect(() => {
    const id = user?.id ?? null;
    const justLoggedIn = !prevUserId.current && id;
    prevUserId.current = id;
    if (!id) setOpen(false); // đăng xuất khi popup đang mở
    else if (justLoggedIn && user.role !== 'admin' && !user.mustChangePassword) setOpen(true);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chỉ hỏi "đã đánh giá chưa" khi popup đang mở (tránh gọi /feedback/me trên mọi trang)
  const mine = useMyPlatformFeedback({ enabled: open && FEEDBACK_ENABLED });
  if (!open || !user) return null;

  const close = () => setOpen(false);
  const rated = !!mine.data;
  const canReward = user.role === 'customer' && !mine.data?.rewardCredits;
  const rate = () => {
    close();
    openFeedback('footer'); // BE chỉ có after_order | footer | landing | app — "footer" là nút đánh giá chung trên web
  };

  return (
    <ModalShell open onClose={close} title={t('welcomeSocial.title', { name: user.name || '' })}
      footer={<button onClick={close} className="btn btn-ghost">{t('welcomeSocial.later')}</button>}>
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3">
          <p className="text-base-content/75">{t('welcomeSocial.followIntro')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer"
              className="btn h-auto justify-start gap-3 rounded-2xl border-0 bg-[#1877F2] py-3 text-white hover:bg-[#1465d1]">
              <FacebookIcon width={22} height={22} />
              <span className="text-left leading-tight"><span className="block font-semibold">Facebook</span><span className="text-xs opacity-90">{t('welcomeSocial.facebookHint')}</span></span>
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer"
              className="btn h-auto justify-start gap-3 rounded-2xl border-0 bg-black py-3 text-white hover:bg-neutral-800">
              <TiktokIcon width={22} height={22} />
              <span className="text-left leading-tight"><span className="block font-semibold">TikTok</span><span className="text-xs opacity-90">@woodhub2026</span></span>
            </a>
          </div>
        </section>

        {FEEDBACK_ENABLED && (
          <section className="flex flex-col gap-3 rounded-2xl bg-base-200 p-4">
            <div className="flex items-center gap-2">
              <Star width={20} height={20} className="text-warning" />
              <h3 className="font-semibold">{t('welcomeSocial.rateTitle')}</h3>
            </div>
            {mine.isLoading ? (
              <span className="loading loading-dots loading-sm" />
            ) : rated ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-base-content/75">{t('welcomeSocial.rated', { rating: mine.data.rating })}</p>
                <button onClick={rate} className="btn btn-ghost btn-sm">{t('welcomeSocial.editRating')}</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-base-content/75">{t('welcomeSocial.rateBody')}</p>
                {canReward && <p className="text-sm text-primary">🎁 {t('welcomeSocial.rateReward', { count: FEEDBACK_REWARD })}</p>}
                <button onClick={rate} className="btn btn-primary btn-sm self-start">{t('welcomeSocial.rateCta')}</button>
              </>
            )}
          </section>
        )}
      </div>
    </ModalShell>
  );
}
