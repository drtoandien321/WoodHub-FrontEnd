import { MapPin, Star, Bolt, Sofa, Cabinet, Tree, Layers } from './icons.jsx';

// Icon gợi nhớ cho từng chip (theo id filter). id 'all' không có icon.
const FILTER_ICONS = {
  near: MapPin,
  topRated: Star,
  fast: Bolt,
  chairs: Sofa,
  cabinets: Cabinet,
  oak: Tree,
  hcm: MapPin,
  all: Layers,
};

/*
 * Thanh filter dạng chip cuộn ngang (mobile vẫn cuộn được).
 * Chip active: nền nâu đậm / chữ kem. Chip thường: nền kem, viền nâu nhạt.
 * Logic lọc nằm ở trang cha — component này chỉ phát sự kiện onChange(id).
 */
export default function SupplierFilterBar({ filters = [], active = 'all', onChange }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filters.map((f) => {
        const Icon = FILTER_ICONS[f.id];
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange?.(f.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-primary bg-primary text-primary-content'
                : 'border-base-300 bg-base-100 text-base-content/80 hover:border-primary/50 hover:text-primary'
            }`}
          >
            {Icon && <Icon width={15} height={15} />}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
