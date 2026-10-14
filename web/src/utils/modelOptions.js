/*
 * modelOptions — chuẩn hoá `editableOptions` của Model3dResponse cho UI chỉnh sửa.
 *
 * Có 2 dạng BE trả:
 *  - Template (seed): { colors: ['#hex',…], materials: ['oak',…], dimensions: { width:[min,max], … } }
 *  - Model AI (Meshy) — BE tự gán mặc định: { color: ['default','walnut','oak','cherry'], material: ['wood'] }
 *    (khoá SỐ ÍT, giá trị là TÊN). BE kiểm tra config.color/config.material của thiết kế phải nằm trong các danh sách
 *    này (400 nếu khác) → khi lưu phải gửi ĐÚNG giá trị trong danh sách (tên), còn UI cần hex để nhuộm mô hình.
 *
 * Meshy sinh ra 1 mesh cố định có texture sẵn (không parametric) nên "chỉnh" ở đây chỉ là:
 *  - Màu: nhuộm (nhân) lên texture bằng baseColorFactor — đúng cho gỗ sáng, KHÔNG phải sơn lại hoàn toàn.
 *  - Kích thước: phóng/thu theo từng trục để xem trước & ghi vào cấu hình gửi xưởng (số đo thật do xưởng chốt).
 *  - Chất liệu: chỉ là nhãn tham khảo cho xưởng.
 */
export const NAMED_COLORS = {
  default: null, // không nhuộm — giữ màu gốc của mô hình
  walnut: '#6E4C34',
  oak: '#C8A27A',
  cherry: '#8B3A2B',
};

// Kích thước danh nghĩa (cm: rộng, cao, sâu) theo loại — mesh AI không mang số đo thật
const DEFAULT_DIMS = {
  sofa: [210, 85, 90], chair: [48, 85, 52], table: [160, 75, 85], cabinet: [150, 200, 58], shelf: [80, 180, 32], bed: [180, 45, 200], decor: [30, 45, 30],
};

const mid = ([min, max]) => Math.round((min + max) / 2);

export function normalizeOptions(model) {
  const opt = model?.editableOptions ?? {};
  const rawColors = Array.isArray(opt.colors) ? opt.colors : Array.isArray(opt.color) ? opt.color : [];
  const colors = rawColors.map((v) => ({ value: v, hex: String(v).startsWith('#') ? v : (NAMED_COLORS[v] ?? '#B08968'), label: v }));
  const materials = Array.isArray(opt.materials) ? opt.materials : Array.isArray(opt.material) ? opt.material : [];

  let dimensions = null;
  let nominal = false;
  if (opt.dimensions) {
    dimensions = { width: opt.dimensions.width, height: opt.dimensions.height, depth: opt.dimensions.depth };
  } else if (model?.source === 'ai_generated' || opt.color || opt.material) {
    const [w, h, d] = DEFAULT_DIMS[String(model?.productType || '').toLowerCase()] ?? [100, 75, 60];
    const r = (b) => [Math.max(10, Math.round(b * 0.5)), Math.round(b * 1.6)];
    dimensions = { width: r(w), height: r(h), depth: r(d) };
    nominal = true;
  }
  return { colors, materials, dimensions, nominal };
}

export const hexOfColor = (model, value) => {
  if (!value) return null;
  return normalizeOptions(model).colors.find((c) => c.value === value)?.hex ?? (String(value).startsWith('#') ? value : null);
};

/** Cấu hình mặc định: giá trị đầu mỗi danh sách, kích thước = trung điểm khoảng. */
export function defaultConfiguration(model) {
  const o = normalizeOptions(model);
  const d = o.dimensions;
  return {
    material: o.materials[0] ?? null,
    color: o.colors[0]?.value ?? null,
    dimensions: d ? { width: mid(d.width ?? [0, 0]), height: mid(d.height ?? [0, 0]), depth: mid(d.depth ?? [0, 0]) } : null,
  };
}

/** Tỉ lệ phóng theo từng trục so với cấu hình mặc định (để xem trước). */
export function scaleOf(model, configuration) {
  const base = defaultConfiguration(model).dimensions;
  const cur = configuration?.dimensions;
  if (!base || !cur) return [1, 1, 1];
  return ['width', 'height', 'depth'].map((k) => (base[k] > 0 && cur[k] > 0 ? cur[k] / base[k] : 1));
}
