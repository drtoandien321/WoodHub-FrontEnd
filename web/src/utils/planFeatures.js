/*
 * planFeatures — LOGIC THUẦN dựng danh sách quyền lợi của gói cho Bảng giá + modal thanh toán (test được, không phụ thuộc React).
 *
 * Nguồn dữ liệu: `plan.featureLimits` (do BE trả, đây là hạn mức CÓ HIỆU LỰC THẬT: -1 = không giới hạn, n = n lượt/tháng,
 * 0/thiếu = không có) + `plan.displayFeatures` (dòng chữ marketing do admin nhập, tuỳ chọn).
 *
 * CHỈ hiển thị các tính năng mà BE thực sự thực thi (SHOWN_FEATURES). `ar_3d` và `export` cố ý KHÔNG nằm ở đây:
 * có số liệu trong DB nhưng không nơi nào trừ lượt / chưa có tính năng — hiển thị sẽ là quảng cáo thứ chưa có (xem docs/phase5-plan-features.md).
 * Thêm key vào SHOWN_FEATURES CHỈ KHI BE đã chặn thật theo key đó.
 */
export const SHOWN_FEATURES = ['design', 'ai_chat'];

const toNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

/** { kind: 'unlimited' } | { kind: 'limit', count } | { kind: 'none' } */
export function featureValue(plan, key) {
  const n = toNum(plan?.featureLimits?.[key]);
  if (n === -1) return { kind: 'unlimited' };
  if (Number.isFinite(n) && n > 0) return { kind: 'limit', count: Math.round(n) };
  return { kind: 'none' };
}

/** Giá trị so sánh: unlimited > mọi số > none */
const rank = (v) => (v.kind === 'unlimited' ? Infinity : v.kind === 'limit' ? v.count : 0);

export const planRows = (plan) => SHOWN_FEATURES.map((key) => ({ key, ...featureValue(plan, key) }));

/** Dòng marketing của admin: chỉ lấy chuỗi không rỗng, bỏ trùng. */
export function planExtras(plan) {
  const list = Array.isArray(plan?.displayFeatures) ? plan.displayFeatures : [];
  return [...new Set(list.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()))];
}

export const sortPlans = (plans) =>
  [...(plans ?? [])].sort((a, b) => (toNum(a.sortOrder) || 0) - (toNum(b.sortOrder) || 0) || (toNum(a.price) || 0) - (toNum(b.price) || 0));

/**
 * Gói đầu tiên: liệt kê đủ. Gói sau: chỉ liệt kê phần TỐT HƠN gói liền trước + ghi "Tất cả quyền lợi của gói <trước>, thêm:".
 * Trả về [{ plan, inheritFrom: plan|null, rows, extras }] theo thứ tự hiển thị.
 */
export function planComparison(plans) {
  const sorted = sortPlans(plans);
  return sorted.map((plan, i) => {
    const prev = sorted[i - 1] ?? null;
    const rows = planRows(plan);
    if (!prev) return { plan, inheritFrom: null, rows, extras: planExtras(plan) };
    const prevByKey = Object.fromEntries(planRows(prev).map((r) => [r.key, r]));
    const better = rows.filter((r) => rank(r) > rank(prevByKey[r.key]));
    const prevExtras = new Set(planExtras(prev));
    return { plan, inheritFrom: prev, rows: better, extras: planExtras(plan).filter((x) => !prevExtras.has(x)) };
  });
}

/** Cho modal: mọi quyền lợi có thật của chính gói đó (không dùng "kế thừa"), quyền lợi có giá trị đứng trước. */
export function planHighlights(plan) {
  const rows = planRows(plan).filter((r) => r.kind !== 'none').map((r) => ({ type: 'row', ...r }));
  return [...rows, ...planExtras(plan).map((text) => ({ type: 'text', text }))];
}

// ---- Thời hạn hiệu lực dự kiến (ước lượng phía FE: BE không trả ngày dự kiến) ----

/** Cộng n tháng như Java `plusMonths`: ngày vượt quá tháng đích thì lùi về cuối tháng (31/1 + 1 tháng = 28/2). */
export function addMonths(date, n = 1) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Hiệu lực dự kiến sau khi thanh toán `plan`.
 *  - Đang dùng ĐÚNG gói này và còn hạn → cộng dồn: hạn mới = hạn hiện tại + 1 tháng (khớp BE, AUD-004b).
 *  - Ngược lại → 1 tháng kể từ bây giờ.
 * Trả về chuỗi 'YYYY-MM-DD' (giờ địa phương) để formatDay hiển thị đúng ngày.
 */
export function planValidity(subscription, plan, now = new Date()) {
  const end = subscription?.endDate ? new Date(subscription.endDate) : null;
  const stacked = subscription?.status === 'active' && subscription?.plan?.id === plan?.id && end && end > now;
  if (stacked) return { stacked: true, from: ymd(now), currentEnd: ymd(end), to: ymd(addMonths(end, 1)) };
  return { stacked: false, from: ymd(now), currentEnd: null, to: ymd(addMonths(now, 1)) };
}
