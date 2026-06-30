import { useTranslation } from 'react-i18next';
import SectionCard from './SectionCard.jsx';
import SafeImage from './SafeImage.jsx';
import { Image, ChevronRight } from './icons.jsx';

/*
 * Section "Portfolio" — grid ảnh sản phẩm/xưởng (3x2 desktop, 2 cột tablet, 1–2 cột mobile).
 * "Xem tất cả" để placeholder (chưa có trang gallery riêng) — gắn route sau khi có.
 */
export default function SupplierPortfolio({ supplier, onViewAll }) {
  const { t } = useTranslation();

  const viewAll = (
    <button onClick={onViewAll} className="btn btn-ghost btn-sm gap-1 text-primary">
      {t('suppliers.viewAll')} <ChevronRight width={15} height={15} />
    </button>
  );

  return (
    <SectionCard icon={Image} title={t('suppliers.sectionPortfolio')} action={viewAll}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {supplier.portfolio.map((src, i) => (
          <SafeImage
            key={i}
            src={src}
            alt={`${supplier.name} — ${i + 1}`}
            className="aspect-[4/3] w-full rounded-2xl transition-transform duration-300 hover:scale-[1.03]"
          />
        ))}
      </div>
    </SectionCard>
  );
}
