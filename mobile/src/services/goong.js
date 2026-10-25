/*
 * Goong (bản đồ VN) cho app — key RIÊNG của app (chốt 25/10): key web bị giới hạn tên miền woodhub.io.vn nên gọi từ app trả 403.
 * Cấu hình bằng biến môi trường (Expo tự nhúng biến EXPO_PUBLIC_* lúc build):
 *   EXPO_PUBLIC_GOONG_API_KEY       — REST geocode (địa chỉ chữ → toạ độ)
 *   EXPO_PUBLIC_GOONG_MAPTILES_KEY  — tile bản đồ cho ghim vị trí
 * Thiếu key → GOONG_READY = false: form địa chỉ báo rõ và cho dùng GPS tạm (xem AddressFormScreen).
 */
export const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY || '';
export const GOONG_MAPTILES_KEY = process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY || '';
export const GOONG_READY = Boolean(GOONG_API_KEY && GOONG_MAPTILES_KEY);

/*
 * Tách Phường/Quận/Tỉnh — giống web services/goong.js: Goong để `types` rỗng nên suy theo VỊ TRÍ TÍNH TỪ CUỐI mảng
 * address_components (thứ tự cố định cụ thể → tổng quát: …, Phường, Quận, Tỉnh).
 */
function partsOf(first) {
  const comps = first?.address_components ?? [];
  const n = comps.length;
  const at = (i) => (comps[i]?.long_name ?? '').trim();
  return { city: n >= 1 ? at(n - 1) : '', district: n >= 2 ? at(n - 2) : '', ward: n >= 3 ? at(n - 3) : '' };
}

/** Địa chỉ chữ → { latitude, longitude, formattedAddress, ward, district, city } | null (không tìm thấy). Lỗi mạng/key → throw. */
export async function geocodeAddress(query) {
  if (!GOONG_API_KEY) throw new Error('GOONG_KEY_MISSING');
  const res = await fetch(`https://rsapi.goong.io/geocode?address=${encodeURIComponent(query)}&api_key=${GOONG_API_KEY}`);
  if (!res.ok) throw new Error(`GOONG_HTTP_${res.status}`);
  const data = await res.json();
  const first = data?.results?.[0];
  if (!first) return null;
  return { latitude: first.geometry.location.lat, longitude: first.geometry.location.lng, formattedAddress: first.formatted_address, ...partsOf(first) };
}
