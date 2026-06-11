import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const Sparkles = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2m0 14v2M5 12H3m18 0h-2M7 7 5.5 5.5M18.5 18.5 17 17M7 17l-1.5 1.5M18.5 5.5 17 7" /><circle cx="12" cy="12" r="3.5" /></svg>
);

export default function HeroBadge() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/20 mx-auto mb-3 w-fit"
    >
      <Sparkles className="w-4 h-4 text-hero-ink/80" />
      <span className="text-[14px] font-normal text-hero-ink/90">{t('hero.badge')}</span>
    </motion.div>
  );
}
