import { useTranslation } from 'react-i18next';
import SectionCard from './SectionCard.jsx';
import SafeImage from './SafeImage.jsx';
import { Image, ChevronRight } from './icons.jsx';

/*
 * Section "Portfolio" — items từ PortfolioResponse[] (GET /suppliers/{id}/portfolio), KHÔNG
 * còn lấy từ supplier.portfolio (field đó không tồn tại ở SupplierPublicResponse). Ẩn cả section
 * nếu supplier chưa có mục portfolio nào.
 */
export default function SupplierPortfolio({ items = [], supplierName, onViewAll }) {
  const { t } = useTranslation();
  if (!items.length) return null;

  const viewAll = (
    <button onClick={onViewAll} className="btn btn-ghost btn-sm gap-1 text-primary">
      {t('suppliers.viewAll')} <ChevronRight width={15} height={15} />
    </button>
  );

  return (
    <SectionCard icon={Image} title={t('suppliers.sectionPortfolio')} action={viewAll}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <SafeImage
            key={item.id}
            src={item.imageUrl}
            alt={item.title || `${supplierName} — portfolio`}
            className="aspect-[4/3] w-full rounded-2xl transition-transform duration-300 hover:scale-[1.03]"
          />
        ))}
      </div>
    </SectionCard>
  );
}
