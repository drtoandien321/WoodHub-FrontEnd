import { useNearbyStoresBySupplier } from '../../hooks/useNearbyStores.js';
import { MapPin } from '../suppliers/icons.jsx';

/*
 * NearbyBranchPicker — 1 khối "chọn chi nhánh gần bạn" cho 1 supplier cụ thể trong giỏ hàng
 * (LUỒNG 1, Pha 3 tính năng GPS). Progressive enhancement THUẦN TUÝ — im lặng ẩn hẳn (return null)
 * nếu supplier này không có chi nhánh nào có toạ độ, KHÔNG hiện "không tìm thấy" gây rối mắt vì
 * đây là tính năng cộng thêm, không phải điều kiện bắt buộc để đặt hàng.
 */
export default function NearbyBranchPicker({ supplierId, supplierName, coords, selectedId, onSelect }) {
  const { data, isLoading } = useNearbyStoresBySupplier(supplierId, coords);
  const stores = data ?? [];

  if (isLoading) return <div className="skeleton h-14 rounded-xl" />;
  if (!stores.length) return null;

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-3">
      <p className="mb-2 text-sm font-medium">
        Chọn chi nhánh gần bạn — <span className="text-primary">{supplierName}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        {stores.map((s) => (
          <label
            key={s.id}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors ${
              selectedId === s.id ? 'border-primary bg-primary/5' : 'border-base-300'
            }`}
          >
            <input
              type="radio" name={`branch-${supplierId}`} checked={selectedId === s.id}
              onChange={() => onSelect(s)} className="radio radio-primary radio-sm shrink-0"
            />
            <MapPin width={14} height={14} className="shrink-0 text-base-content/40" />
            <span className="min-w-0 flex-1 truncate">{[s.address, s.ward, s.district, s.city].filter(Boolean).join(', ')}</span>
            <span className="shrink-0 font-medium text-primary">{s.distanceKm} km</span>
          </label>
        ))}
      </div>
    </div>
  );
}
