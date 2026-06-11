import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWorkshops } from '../hooks/useProducts.js';

export default function Suppliers() {
  const { data, isLoading } = useWorkshops();
  const { t } = useTranslation();

  // Nhãn hiển thị cho id loại sản phẩm/vật liệu — lấy từ i18n, chỉ phục vụ trang này
  const typeLabels = t('suppliers.types', { returnObjects: true });
  const materialLabels = t('suppliers.materials', { returnObjects: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">{t('suppliers.title')}</h1>
        <p className="text-sm text-base-content/60 mt-1">{t('suppliers.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items?.map((w) => (
            <div key={w.id} className="card bg-base-100 border border-base-300 p-5 gap-3">
              <div>
                <h3 className="font-medium text-lg">{w.name}</h3>
                <p className="text-sm text-base-content/60">{w.district}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span>★ {w.rating}</span>
                <span className="text-base-content/60">{t('suppliers.completedJobs', { count: w.completedJobs })}</span>
                <span className="text-base-content/60">{t('suppliers.leadTime', { days: w.leadTimeDays })}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {w.capability.types.map((ty) => (
                  <span key={ty} className="badge badge-outline badge-sm">{typeLabels[ty] ?? ty}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {w.capability.materials.map((m) => (
                  <span key={m} className="badge badge-ghost badge-sm">{t('suppliers.materialBadge', { material: materialLabels[m] ?? m })}</span>
                ))}
              </div>

              <Link to="/custom" className="btn btn-primary btn-sm self-start mt-1">{t('suppliers.cta')}</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
