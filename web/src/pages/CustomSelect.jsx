import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProductTypes } from '../hooks/useProducts.js';

export default function CustomSelect() {
  const { t } = useTranslation();
  const { data, isLoading } = useProductTypes();

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl mb-2">{t('custom.selectTitle')}</h1>
        <p className="text-base-content/70 text-sm">{t('custom.selectDesc')}</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.items?.map((pt) => (
            <Link key={pt.id} to={`/custom/configure/${pt.id}`} className="card bg-base-200 border border-base-300 hover:border-primary hover:shadow-lg transition-all p-6 items-center text-center gap-2">
              <span className="text-4xl">{pt.emoji}</span>
              <h3 className="font-medium">{t(`custom.types.${pt.id}.name`)}</h3>
              <p className="text-xs text-base-content/60">{t(`custom.types.${pt.id}.desc`)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
