/*
 * Google Analytics 4 — đo lượng truy cập (đặc biệt traffic từ Facebook/TikTok).
 *
 * - Bật khi có VITE_GA_MEASUREMENT_ID (dạng G-XXXXXXXXXX) trong .env; không có thì mọi hàm là no-op
 *   (dev/mock không gửi dữ liệu rác).
 * - App là SPA: GA tự gửi page_view chỉ lúc tải trang đầu → phải TỰ gửi page_view mỗi lần đổi route
 *   (xem components/AnalyticsTracker.jsx). Vì vậy config có send_page_view:false.
 * - UTM (utm_source/medium/campaign) và fbclid/ttclid: GA4 tự đọc từ `page_location` (URL đầy đủ có
 *   query string) → ta luôn gửi location kèm search ở lần page_view đầu là đủ.
 */
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
let started = false;

export function initAnalytics() {
  if (!GA_ID || started || typeof document === 'undefined') return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  // gtag PHẢI push đối tượng `arguments` (không phải mảng) — yêu cầu của gtag.js
  window.gtag = function gtag() { window.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

export function trackPageView(path) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href, // gồm ?utm_...: GA dùng để gán nguồn chiến dịch
    page_title: document.title,
  });
}

/*
 * Sự kiện chuyển đổi theo tên chuẩn ecommerce của GA4 (để báo cáo "Monetization" tự nhận):
 *  add_to_cart (ProductInfo) → begin_checkout (Checkout mở) → purchase (Checkout đặt đơn thành công).
 * params: { currency: 'VND', value, items: [{ item_id, item_name, price, quantity }] } — value là SỐ (VND, không định dạng).
 */
export function trackEvent(name, params = {}) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', name, params);
}
