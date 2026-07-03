import { useTranslation } from 'react-i18next';
import SectionCard from './SectionCard.jsx';
import { MapPin, Store } from './icons.jsx';

/*
 * Section "Chi nhánh" — StorePublicResponse[] chỉ có district/city (BE CỐ TÌNH không lộ địa chỉ
 * đường/tọa độ cho khách xem công khai). Ẩn cả section nếu supplier chưa có chi nhánh nào.
 */
export default function SupplierBranches({ branches = [] }) {
  const { t } = useTranslation();
  if (!branches.length) return null;

  return (
    <SectionCard icon={Store} title={t('suppliers.sectionBranches')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {branches.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <MapPin width={18} height={18} />
            </span>
            <span className="text-sm font-medium">{[b.district, b.city].filter(Boolean).join(', ')}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
