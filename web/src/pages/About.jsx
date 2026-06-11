import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();
  const paragraphs = t('about.paragraphs', { returnObjects: true });
  const values = t('about.values', { returnObjects: true });

  return (
    <div className="flex flex-col gap-12">
      {/* Câu chuyện */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-3xl md:text-4xl">{t('about.title')}</h1>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base-content/80 leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Khối minh họa — dùng tông màu theme thay vì ảnh thật */}
        <div className="card bg-gradient-to-br from-primary/15 via-secondary/20 to-accent/15 border border-base-300 p-10 aspect-square md:aspect-auto md:h-full flex flex-col items-center justify-center text-center gap-3">
          <span className="text-6xl">🪵</span>
          <p className="font-display text-xl text-primary">{t('about.illustrationQuote')}</p>
          <p className="text-sm text-base-content/60 max-w-xs">{t('about.illustrationDesc')}</p>
        </div>
      </section>

      {/* 3 giá trị cốt lõi */}
      <section>
        <h2 className="font-display text-2xl text-center mb-8">{t('about.valuesTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {values.map((v) => (
            <div key={v.title} className="card bg-base-200 border border-base-300 p-6 gap-3">
              <h3 className="font-medium text-lg">{v.title}</h3>
              <p className="text-sm text-base-content/70">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
