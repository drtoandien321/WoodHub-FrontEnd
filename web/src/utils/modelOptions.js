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
 *  - Kích thước: CHỈ khi mẫu có editableOptions.dimensions (mẫu thư viện admin khai báo) → phóng/thu theo trục để xem
 *    trước + ghi vào cấu hình gửi xưởng. Model AI KHÔNG có dimensions → không hiện (trước đây FE tự bịa khoảng kích thước
 *    "danh nghĩa" theo loại → khách tưởng chỉnh được số đo thật; sai nguyên tắc chỉ hiện thuộc tính BE hỗ trợ).
 *  - Chất liệu: chỉ là nhãn tham khảo cho xưởng (muốn đổi vân thật → "Áp dụng chất liệu bằng AI", BE-05).
 */
export const NAMED_COLORS = {
  default: null, // không nhuộm — giữ màu gốc của mô hình
  walnut: '#6E4C34',
  oak: '#C8A27A',
  cherry: '#8B3A2B',
};

// Màu nhuộm xem trước cho giá trị chất liệu trong editableOptions.material(s) — chỉ để tô trên trình duyệt
export const MATERIAL_TINT = { oak: '#c8a165', walnut: '#5d4030', ash: '#d9c7a7', pine: '#e0c694', wood: null };

const mid = ([min, max]) => Math.round((min + max) / 2);

export function normalizeOptions(model) {
  const opt = model?.editableOptions ?? {};
  const rawColors = Array.isArray(opt.colors) ? opt.colors : Array.isArray(opt.color) ? opt.color : [];
  // hex null = KHÔNG nhuộm (giữ màu gốc). Lỗi cũ: 'default' (null) bị ?? biến thành nâu #B08968 → 'màu gốc' vẫn nhuộm mô hình.
  const hexOf = (v) => (String(v).startsWith('#') ? v : v in NAMED_COLORS ? NAMED_COLORS[v] : '#B08968');
  const colors = rawColors.map((v) => ({ value: v, hex: hexOf(v), label: v }));
  const materials = Array.isArray(opt.materials) ? opt.materials : Array.isArray(opt.material) ? opt.material : [];

  const dimensions = opt.dimensions
    ? { width: opt.dimensions.width, height: opt.dimensions.height, depth: opt.dimensions.depth }
    : null;
  return { colors, materials, dimensions };
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
