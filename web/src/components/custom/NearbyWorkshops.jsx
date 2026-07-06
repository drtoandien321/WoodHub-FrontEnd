import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNearestWorkshops, useWorkshopsWithinRadius } from '../../hooks/useNearbyStores.js';
import { useSupplierChatStore } from '../../stores/supplierChatStore.js';
import { MapPin, MessageCircle } from '../suppliers/icons.jsx';

/*
 * NearbyWorkshops — LUỒNG 2 (Pha 4, tính năng GPS). 2 CHẾ ĐỘ dùng 2 API riêng biệt (không gộp
 * logic): "5 gần nhất" (GET /stores/nearby/workshops) và "Theo bán kính" (GET
 * /stores/nearby/workshops/radius) — đổi bán kính gọi lại API tương ứng, không tự lọc client-side.
 *
 * CTA dùng hành động THẬT đã có sẵn (không bịa luồng "yêu cầu báo giá nhắm 1 xưởng" — chưa xây):
 * "Xem hồ sơ" → trang public supplier thật; "Nhắn tin" → mở chat thật với xưởng đó ngay.
 */
const RADIUS_OPTIONS = [5, 10, 20];

export default function NearbyWorkshops({ coords }) {
  const [mode, setMode] = useState('nearest'); // 'nearest' | 'radius'
  const [radiusKm, setRadiusKm] = useState(10);
  const openChat = useSupplierChatStore((s) => s.openFromSupplier);

  const nearest = useNearestWorkshops(coords, 5);
  const withinRadius = useWorkshopsWithinRadius(coords, radiusKm);
  const { data, isLoading } = mode === 'nearest' ? nearest : withinRadius;
  const workshops = data ?? [];

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg">Xưởng gần bạn</h2>
        <div className="join">
          <button onClick={() => setMode('nearest')} className={`btn btn-sm join-item ${mode === 'nearest' ? 'btn-primary' : 'btn-outline'}`}>5 gần nhất</button>
          <button onClick={() => setMode('radius')} className={`btn btn-sm join-item ${mode === 'radius' ? 'btn-primary' : 'btn-outline'}`}>Theo bán kính</button>
        </div>
      </div>

      {mode === 'radius' && (
        <div className="mb-3 flex gap-2">
          {RADIUS_OPTIONS.map((km) => (
            <button key={km} onClick={() => setRadiusKm(km)} className={`btn btn-xs ${radiusKm === km ? 'btn-primary' : 'btn-outline'}`}>{km} km</button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : workshops.length ? (
        <div className="flex flex-col gap-2">
          {workshops.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-base-300 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-base-200 text-primary"><MapPin width={16} height={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{w.businessName}</p>
                <p className="truncate text-xs text-base-content/55">{[w.address, w.district, w.city].filter(Boolean).join(', ')}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-primary">{w.distanceKm} km</span>
              <div className="flex shrink-0 gap-1.5">
                <Link to={`/suppliers/${w.supplierId}`} className="btn btn-ghost btn-xs">Xem hồ sơ</Link>
                <button onClick={() => openChat({ id: w.supplierId, name: w.businessName })} className="btn btn-primary btn-xs gap-1">
                  <MessageCircle width={13} height={13} /> Nhắn tin
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-base-content/50">
          {mode === 'radius' ? `Không có xưởng nào trong bán kính ${radiusKm}km.` : 'Chưa có xưởng nào gần bạn.'}
        </p>
      )}
    </section>
  );
}
