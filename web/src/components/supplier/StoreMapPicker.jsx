import { useEffect, useRef } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

/*
 * StoreMapPicker — bản đồ Goong cho phép supplier ĐẶT GHIM vị trí chi nhánh.
 * 2 cách đặt ghim (đúng luồng đã chốt):
 *  1. Cha (StoreFormModal) geocode xong, truyền `latitude/longitude` mới → map tự pan tới,
 *     ghim tự nhảy tới (useEffect theo dõi latitude/longitude).
 *  2. Supplier tự thao tác trực tiếp trên bản đồ — click để đặt ghim (dự phòng khi geocode
 *     thất bại), hoặc kéo ghim đã có để tinh chỉnh (dragend) — cả 2 đều gọi `onChange`.
 *
 * ⚠️ goong-js dùng thứ tự [longitude, latitude] cho center/LngLat (giống mapbox-gl) — NGƯỢC
 * với field `latitude/longitude` ở body BE. Chỉ quy đổi thứ tự NGAY TẠI ranh giới file này —
 * props/callback ra ngoài luôn dùng tên đầy đủ `latitude`/`longitude` cho nhất quán với body BE
 * (xem quy ước tên field toạ độ ở docs/API_CONTRACT.md mục 0).
 */
const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;
const DEFAULT_CENTER = { latitude: 10.7769, longitude: 106.7009 }; // trung tâm TP.HCM — chưa có ghim thì center ở đây, zoom xa
const DEFAULT_ZOOM = 11;
const MARKER_ZOOM = 16;

export default function StoreMapPicker({ latitude, longitude, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const placeMarker = (lat, lng) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      return;
    }
    const marker = new goongjs.Marker({ draggable: true }).setLngLat([lng, lat]).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLngLat();
      onChange(pos.lat, pos.lng);
    });
    markerRef.current = marker;
  };

  // Khởi tạo map — CHỈ 1 lần lúc mount (map instance không tái tạo theo re-render).
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPTILES_KEY) return;
    goongjs.accessToken = MAPTILES_KEY;
    const map = new goongjs.Map({
      container: containerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAPTILES_KEY}`,
      center: [longitude ?? DEFAULT_CENTER.longitude, latitude ?? DEFAULT_CENTER.latitude],
      zoom: latitude != null ? MARKER_ZOOM : DEFAULT_ZOOM,
    });
    mapRef.current = map;

    // Click thủ công lên bản đồ — dự phòng khi geocode từ địa chỉ không ra kết quả.
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      placeMarker(lat, lng);
      onChange(lat, lng);
    });

    if (latitude != null && longitude != null) placeMarker(latitude, longitude);

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // latitude/longitude đổi TỪ BÊN NGOÀI (sau khi geocode từ địa chỉ thành công) → pan + đặt ghim,
  // KHÔNG gọi lại onChange (tránh vòng lặp — giá trị này đã từ chính state của cha ra).
  useEffect(() => {
    if (!mapRef.current || latitude == null || longitude == null) return;
    mapRef.current.flyTo({ center: [longitude, latitude], zoom: MARKER_ZOOM });
    placeMarker(latitude, longitude);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  if (!MAPTILES_KEY) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200 text-center text-sm text-base-content/50">
        Chưa cấu hình VITE_GOONG_MAPTILES_KEY — không thể hiển thị bản đồ.
      </div>
    );
  }

  return <div ref={containerRef} className="h-72 w-full rounded-xl border border-base-300" />;
}
