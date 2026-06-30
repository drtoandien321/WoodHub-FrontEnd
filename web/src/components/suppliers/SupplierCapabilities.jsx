import { useTranslation } from 'react-i18next';
import SectionCard from './SectionCard.jsx';
import { Briefcase, Sofa, Calendar, MapPin, Layers, Tree } from './icons.jsx';

/*
 * Section "Năng lực sản xuất" — grid info card. Mỗi ô: icon + nhãn + giá trị (lấy từ data xưởng).
 */
export default function SupplierCapabilities({ supplier }) {
  const { t } = useTranslation();

  const items = [
    { icon: Sofa, label: t('suppliers.cap.specialty'), value: supplier.specialties.join(', ') },
    { icon: Calendar, label: t('suppliers.cap.capacity'), value: supplier.capacity },
    { icon: MapPin, label: t('suppliers.cap.serviceArea'), value: supplier.serviceArea },
    { icon: Layers, label: t('suppliers.cap.products'), value: supplier.supportedProducts },
    { icon: Tree, label: t('suppliers.cap.wood'), value: supplier.supportedWood.join(', ') },
  ];

  return (
    <SectionCard icon={Briefcase} title={t('suppliers.sectionCapabilities')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="flex gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <it.icon width={18} height={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-base-content">{it.label}</p>
              <p className="mt-0.5 text-sm text-base-content/70">{it.value}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
