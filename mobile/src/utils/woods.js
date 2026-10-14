/*
 * Dữ liệu tuỳ chỉnh dùng ở Trình xem 3D. BE chỉ trả `editableOptions` (danh sách màu hex, id chất liệu, khoảng kích thước) —
 * phần tên/hệ số giá dưới đây là của app (thiết kế). Giá chỉ là ƯỚC TÍNH tham khảo; báo giá thật do xưởng đưa ra.
 */
export const WOODS = [
  { n: 'Sồi tự nhiên', c: '#C8A27A' }, { n: 'Mật ong', c: '#B57D42' }, { n: 'Óc chó', c: '#6E4C34' },
  { n: 'Cà phê', c: '#4B3527' }, { n: 'Xám tro', c: '#9C9389' }, { n: 'Trắng sữa', c: '#E6D9C3' },
];

// id chất liệu của BE (editableOptions.materials) → tên hiển thị + hệ số giá
export const MATERIALS = {
  oak: { n: 'Sồi', f: 1, c: '#C8A165' },
  walnut: { n: 'Óc chó', f: 1.35, c: '#5D4030' },
  ash: { n: 'Tần bì', f: 0.9, c: '#D9C7A7' },
  pine: { n: 'Thông', f: 0.7, c: '#E0C694' },
  rubber: { n: 'Cao su', f: 0.8, c: '#CFA97A' },
};
export const DEFAULT_MATERIAL_IDS = ['oak', 'walnut', 'pine', 'rubber'];

// Giá gốc tham khảo theo loại đồ (VND) khi mô hình không gắn với sản phẩm có giá
export const BASE_PRICE = { sofa: 12500000, chair: 1450000, table: 7900000, cabinet: 11200000, shelf: 1800000, bed: 9600000, decor: 850000 };
export const basePriceFor = (type) => BASE_PRICE[String(type || '').toLowerCase()] ?? 4200000;

export const TYPE_LABELS = { sofa: 'Sofa', chair: 'Ghế', table: 'Bàn', cabinet: 'Tủ', shelf: 'Kệ', bed: 'Giường', decor: 'Trang trí' };
export const TYPES = Object.keys(TYPE_LABELS);

// Kích thước mặc định theo loại khi BE không trả khoảng kích thước (cm: rộng, cao, sâu)
export const DEFAULT_DIMS = {
  sofa: [210, 85, 90], chair: [48, 85, 52], table: [160, 75, 85], cabinet: [150, 200, 58], shelf: [80, 180, 32], bed: [180, 45, 200], decor: [30, 45, 30],
};

const mid = (r) => (Array.isArray(r) ? Math.round((r[0] + r[1]) / 2) : null);

/*
 * Chuẩn hoá editableOptions (cùng quy tắc với web, utils/modelOptions.js). BE có 2 dạng:
 *  - template: { colors: ['#hex'], materials: ['oak'], dimensions }
 *  - model AI (Meshy): { color: ['default','walnut','oak','cherry'], material: ['wood'] } — khoá số ít, giá trị là TÊN.
 *    BE kiểm tra config.color/material của thiết kế nằm trong danh sách này (400 nếu khác) → phải lưu ĐÚNG giá trị tên.
 * Meshy là mesh cố định có texture sẵn: màu = nhuộm lên texture (không sơn lại), kích thước = phóng/thu để xem trước.
 */
export const NAMED_COLORS = { default: null, walnut: '#6E4C34', oak: '#C8A27A', cherry: '#8B3A2B' };
export const COLOR_LABELS = { default: 'Màu gốc', walnut: 'Óc chó', oak: 'Sồi', cherry: 'Anh đào' };

export function colorOptions(model) {
  const opt = model?.editableOptions || {};
  const raw = Array.isArray(opt.colors) && opt.colors.length ? opt.colors : Array.isArray(opt.color) ? opt.color : [];
  if (!raw.length) return WOODS.map((x) => ({ value: x.c, hex: x.c, label: x.n }));
  return raw.map((v) => ({ value: v, hex: String(v).startsWith('#') ? v : (NAMED_COLORS[v] ?? '#B08968'), label: COLOR_LABELS[v] || v }));
}
export const hexOfColor = (model, value) => colorOptions(model).find((c) => c.value === value)?.hex ?? (String(value).startsWith('#') ? value : null);

export function materialIds(model) {
  const opt = model?.editableOptions || {};
  const raw = Array.isArray(opt.materials) && opt.materials.length ? opt.materials : Array.isArray(opt.material) ? opt.material : DEFAULT_MATERIAL_IDS;
  return raw;
}

/** Cấu hình khởi tạo từ model: màu, chất liệu, kích thước (trung điểm khoảng cho phép). */
export function defaultConfig(model) {
  const opt = model?.editableOptions || {};
  const dd = DEFAULT_DIMS[String(model?.productType || '').toLowerCase()] || [100, 75, 60];
  const d = opt.dimensions;
  return {
    color: colorOptions(model)[0].value,
    material: materialIds(model)[0] || 'oak',
    W: mid(d?.width) ?? dd[0], H: mid(d?.height) ?? dd[1], D: mid(d?.depth) ?? dd[2],
  };
}

export function ranges(model, cfg0) {
  const d = model?.editableOptions?.dimensions;
  const r = (arr, base) => (Array.isArray(arr) ? { min: arr[0], max: arr[1] } : { min: Math.max(10, Math.round(base * 0.5)), max: Math.round(base * 1.6) });
  return { W: r(d?.width, cfg0.W), H: r(d?.height, cfg0.H), D: r(d?.depth, cfg0.D) };
}

/** Giá ước tính = giá gốc × hệ số chất liệu × (thể tích mới / thể tích gốc)^0,6, làm tròn 50.000 ₫. */
export function estimatePrice(base, cfg, cfg0) {
  const f = (MATERIALS[cfg.material]?.f ?? 1) / (MATERIALS[cfg0.material]?.f ?? 1);
  const ratio = (cfg.W * cfg.H * cfg.D) / (cfg0.W * cfg0.H * cfg0.D);
  return Math.round((base * f * Math.pow(ratio, 0.6)) / 50000) * 50000;
}
