import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho tính năng GỢI Ý VỊ TRÍ (GPS) — Pha 3 (checkout) + Pha 4 (custom order).
 * Tất cả đều `enabled` theo điều kiện đủ (có coords, có supplierId) — không tự gọi khi thiếu,
 * đúng nguyên tắc "thiếu quyền vị trí/thiếu dữ liệu toạ độ → im lặng ẩn khối gợi ý".
 */

// LUỒNG 1 (Checkout): chi nhánh của 1 supplier cụ thể, gần→xa.
export const useNearbyStoresBySupplier = (supplierId, coords) =>
  useQuery({
    queryKey: ['nearbyStores', supplierId, coords?.latitude, coords?.longitude],
    queryFn: () => api.getNearbyStoresBySupplier({ supplierId, lat: coords.latitude, lng: coords.longitude }),
    enabled: !!supplierId && !!coords,
  });

// LUỒNG 2 (Custom order): top N xưởng gần nhất.
export const useNearestWorkshops = (coords, limit = 5) =>
  useQuery({
    queryKey: ['nearestWorkshops', coords?.latitude, coords?.longitude, limit],
    queryFn: () => api.getNearestWorkshops({ lat: coords.latitude, lng: coords.longitude, limit }),
    enabled: !!coords,
  });

// LUỒNG 2 biến thể bán kính.
export const useWorkshopsWithinRadius = (coords, radiusKm) =>
  useQuery({
    queryKey: ['workshopsWithinRadius', coords?.latitude, coords?.longitude, radiusKm],
    queryFn: () => api.getWorkshopsWithinRadius({ lat: coords.latitude, lng: coords.longitude, radiusKm }),
    enabled: !!coords && !!radiusKm,
  });
