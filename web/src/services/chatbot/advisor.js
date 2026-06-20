import i18n from '../../i18n/index.js';
import { PRODUCTS } from '../../api/mock/data.js';

/*
 * "Bộ não" mock cho AI chatbot — KHÔNG gọi AI thật (scope MVP, chạy offline).
 * Cách hoạt động: dò từ khoá trong câu hỏi (loại sản phẩm / chất liệu / ngân sách)
 * rồi chấm điểm & gợi ý sản phẩm từ chính catalog (data.js).
 *
 * Khi có BE/AI thật: thay getAdvisorReply() bằng 1 lời gọi API (POST /chat) trả về
 * { textKey|text, products } — phần UI (ChatPanel) không phải sửa.
 */

const lang = () => (i18n.language?.startsWith('en') ? 'en' : 'vi');
const loc = (v) => (v && typeof v === 'object' ? v[lang()] ?? v.vi : v);

// Từ khoá nhận diện DANH MỤC (id catalog -> các từ người dùng hay gõ, cả vi/en)
const CATEGORY_KEYWORDS = {
  cat_dining: ['bàn ăn', 'dining', 'bàn an'],
  cat_chair: ['ghế', 'ghe', 'chair', 'seat'],
  cat_bed: ['giường', 'giuong', 'bed', 'ngủ', 'ngu'],
  cat_desk: ['bàn làm việc', 'bàn học', 'lam viec', 'desk', 'office'],
  cat_table: ['bàn trà', 'ban tra', 'coffee', 'trà', 'console'],
  cat_storage: ['kệ', 'ke', 'tủ', 'tu', 'shelf', 'cabinet', 'storage', 'tivi', 'tv', 'sách', 'sach', 'giày', 'giay', 'quần áo', 'quan ao', 'wardrobe'],
};

// Từ khoá nhận diện CHẤT LIỆU
const MATERIAL_KEYWORDS = {
  mat_oak: ['sồi', 'soi', 'oak'],
  mat_walnut: ['óc chó', 'oc cho', 'walnut'],
  mat_pine: ['thông', 'thong', 'pine'],
  mat_rubberwood: ['cao su', 'rubber'],
  mat_mdf: ['mdf', 'melamine', 'công nghiệp', 'cong nghiep'],
  mat_acacia: ['tràm', 'tram', 'acacia'],
};

// Đọc ngân sách tối đa từ câu: "10 triệu", "10tr", "10m", hoặc số nguyên >= 6 chữ số
function parseBudget(text) {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(triệu|trieu|tr|m)\b/);
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000);
  const n = text.match(/(\d{6,})/);
  if (n) return parseInt(n[1], 10);
  return null;
}

// Rút gọn product thành "card" nhẹ để hiển thị trong bong bóng chat (đã localize)
const toCard = (p) => ({
  id: p.id,
  name: loc(p.name),
  material: loc(p.material),
  price: p.price,
  image: p.image,
});

/*
 * Nhận câu hỏi, trả về { textKey, products }.
 * textKey là key i18n (ChatPanel dịch sang vi/en) — giữ text ở 1 chỗ, không lặp chuỗi trong code.
 */
export function getAdvisorReply(rawText) {
  const text = (rawText || '').toLowerCase().trim();

  // Câu chào / câu rỗng → mời gọi mô tả nhu cầu
  if (!text || /(^|\s)(hi|hello|hey|chào|chao|xin chào|xin chao|alo)(\s|$)/.test(text)) {
    return { textKey: 'chatbot.replies.greeting', products: [] };
  }

  const cats = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, kw]) => kw.some((k) => text.includes(k)))
    .map(([id]) => id);
  const mats = Object.entries(MATERIAL_KEYWORDS)
    .filter(([, kw]) => kw.some((k) => text.includes(k)))
    .map(([id]) => id);
  const budget = parseBudget(text);

  // Chỉ gợi ý hàng đang bán, còn hàng, có giá (bỏ draft/archived/hết hàng)
  const candidates = PRODUCTS.filter((p) => p.status === 'active' && p.stock > 0 && p.price > 0);

  const hasFilter = cats.length || mats.length || budget;

  if (hasFilter) {
    const scored = candidates
      .map((p) => {
        let s = 0;
        if (cats.includes(p.categoryId)) s += 2;
        if (mats.includes(p.materialId)) s += 2;
        if (budget) s += p.price <= budget ? 1 : -3; // quá ngân sách bị trừ mạnh
        return { p, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);

    if (!scored.length) return { textKey: 'chatbot.replies.none', products: [] };
    return { textKey: 'chatbot.replies.found', products: scored.map((x) => toCard(x.p)) };
  }

  // Không có từ khoá rõ ràng → gợi ý vài mẫu đánh giá cao
  const featured = [...candidates].sort((a, b) => b.rating - a.rating).slice(0, 3);
  return { textKey: 'chatbot.replies.featured', products: featured.map(toCard) };
}
