import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProductTypes } from '../hooks/useProducts.js';

// Icon nhỏ inline (stroke, ăn theo currentColor)
const Icon = {
  cube: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>,
  sparkle: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
};

export default function CustomSelect() {
  const { t } = useTranslation();
  const { data, isLoading } = useProductTypes();

  const badges = t('custom.selectBadges', { returnObjects: true });
  const steps = t('custom.steps', { returnObjects: true });

  return (
    <div className="flex flex-col gap-12 py-2">
      {/* ===== Hero ===== */}
      <section className="mx-auto max-w-2xl text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {badges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-medium text-base-content/70">
              <Icon.sparkle className="h-3.5 w-3.5 text-primary" /> {b}
            </span>
          ))}
        </div>
        <h1 className="font-display text-3xl md:text-4xl">{t('custom.selectTitle')}</h1>
        <p className="mx-auto mt-2 max-w-xl text-base-content/70">{t('custom.selectDesc')}</p>
      </section>

      {/* ===== Lối vào nhánh AI: mẫu 3D / upload ảnh ===== */}
      <section className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm md:grid-cols-2 md:p-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Icon.cube className="h-4 w-4" /> {t('custom.ai.badge')}
          </span>
          <h2 className="mt-3 font-display text-2xl md:text-3xl">{t('custom.ai.entryTitle')}</h2>
          <p className="mt-2 text-base-content/70">{t('custom.ai.entryDesc')}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link to="/custom/studio" className="btn btn-primary gap-2">
              {t('custom.ai.entryCta')} <Icon.arrow className="h-4 w-4" />
            </Link>
            <Link to="/custom/models" className="text-sm font-medium text-primary hover:underline">{t('custom.ai.browseGallery')}</Link>
          </div>
        </div>

        <Link
          to="/custom/studio"
          className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-[#e7dcc6] to-[#bfa988]"
        >
          <img
            src="/hero/living-room-3d.png"
            alt={t('custom.ai.entryTitle')}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-base-100/85 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
            <Icon.cube className="h-4 w-4" /> AR · 3D
          </span>
        </Link>
      </section>

      {/* ===== Hoặc tự chỉnh số đo: lưới loại sản phẩm (luồng parametric) ===== */}
      <section>
        <div className="mb-5 text-center">
          <h2 className="font-display text-2xl">{t('custom.ai.altEntryTitle')}</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-base-content/60">{t('custom.ai.altEntryDesc')}</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data?.items?.map((pt) => (
              <Link
                key={pt.id}
                to={`/custom/configure/${pt.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[0_16px_40px_rgba(76,52,36,0.12)]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-base-200 text-4xl transition-colors group-hover:bg-primary/10">
                  {pt.emoji}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-lg">{t(`custom.types.${pt.id}.name`)}</h3>
                  <p className="mt-1 text-xs text-base-content/60">{t(`custom.types.${pt.id}.desc`)}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t('custom.startHint')} <Icon.arrow className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== 3 bước ===== */}
      <section>
        <h2 className="mb-5 text-center font-display text-2xl">{t('custom.stepsTitle')}</h2>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={i} className="relative rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-content">{i + 1}</span>
              <h3 className="mt-3 font-display text-lg">{step.title}</h3>
              <p className="mt-1 text-sm text-base-content/65">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
