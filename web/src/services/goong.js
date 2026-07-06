/*
 * goong.js — bọc lại 2 API REST của Goong (https://docs.goong.io) dùng cho form chi nhánh:
 *  - Geocoding: chuỗi địa chỉ → toạ độ (dùng khi supplier bấm "Định vị từ địa chỉ").
 *  - Reverse geocoding: toạ độ → địa chỉ (dùng khi kéo ghim, chỉ để HIỂN THỊ tham khảo,
 *    KHÔNG tự động ghi đè vào field address supplier đã gõ tay).
 *
 * Dùng VITE_GOONG_API_KEY (khác VITE_GOONG_MAPTILES_KEY — key đó chỉ để vẽ bản đồ, xem
 * StoreMapPicker.jsx). Không hardcode key ở đây, luôn đọc từ .env.
 */
const API_KEY = import.meta.env.VITE_GOONG_API_KEY;
const BASE_URL = 'https://rsapi.goong.io';

/**
 * Geocode 1 chuỗi địa chỉ → { latitude, longitude, formattedAddress } hoặc null nếu không tìm thấy.
 * Ném lỗi nếu request thất bại (mất mạng, key sai...) — phân biệt với "không tìm thấy" (trả null).
 */
export async function geocodeAddress(address) {
  const url = `${BASE_URL}/geocode?address=${encodeURIComponent(address)}&api_key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Goong geocode HTTP ${res.status}`);
  const data = await res.json();
  const first = data?.results?.[0];
  if (!first) return null;
  return {
    latitude: first.geometry.location.lat,
    longitude: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
  };
}

/**
 * Reverse geocode toạ độ → chuỗi địa chỉ đọc được, hoặc null nếu không có kết quả.
 * Không throw khi không tìm thấy kết quả — chỉ throw khi request thật sự lỗi (dùng cho UI
 * hiển thị tham khảo, không phải luồng bắt buộc nên fail êm cũng được).
 */
export async function reverseGeocode(latitude, longitude) {
  const url = `${BASE_URL}/geocode?latlng=${latitude},${longitude}&api_key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Goong reverse geocode HTTP ${res.status}`);
  const data = await res.json();
  return data?.results?.[0]?.formatted_address ?? null;
}
