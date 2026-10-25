import { api } from '../api/client.js';

/*
 * Chuyển cấu hình trong app (W/H/D, màu, chất liệu) sang `configuration` của BE (giống web):
 * { material, color, dimensions: { width, height, depth } } — đơn vị cm.
 */
export const configurationOf = (cfg) => ({
  material: cfg.material,
  color: cfg.color,
  dimensions: { width: cfg.W, height: cfg.H, depth: cfg.D },
});

/*
 * designSnapshot của QuoteRequest / CustomOrder (giống web utils/designSnapshot.js): BE trả PHẲNG — key cấu hình (color,
 * material, dimensions…) nằm ở gốc + key `design` = { designName, posterUrl, modelGlbUrl, modelSlug, sourceType, prompt }.
 * Bản cũ đọc snapshot.name / snapshot.thumbnailUrl (BE không có) → mọi thẻ báo giá ghi "Thiết kế" và không có ảnh.
 */
export function readDesignSnapshot(snapshot) {
  const { design, ...configuration } = snapshot ?? {};
  const info = design ?? {};
  return {
    name: info.designName ?? null,
    posterUrl: info.posterUrl ?? null,
    glbUrl: info.modelGlbUrl ?? null,
    modelSlug: info.modelSlug ?? null,
    sourceType: info.sourceType ?? null,
    prompt: info.prompt ?? null,
    configuration,
  };
}

/**
 * Lưu thiết kế = tạo (nếu chưa có) rồi cập nhật status 'completed' (lần đầu trừ 1 lượt thiết kế, 429 nếu hết lượt).
 * `version` bắt buộc cho optimistic locking — lệch (409) thì tải lại version mới nhất để người dùng bấm lưu lại.
 * Trả về design đã lưu { id, version, ... }.
 */
export async function saveDesign({ model, cfg, name, designId, designVersion }) {
  let id = designId;
  let version = designVersion;
  try {
    if (!id) {
      const created = await api.createDesign({ name, modelId: model.id, configuration: configurationOf(cfg), thumbnailUrl: model.posterUrl });
      id = created.id; version = created.version;
    }
    return await api.updateDesign({ id, name, configuration: configurationOf(cfg), thumbnailUrl: model.posterUrl, status: 'completed', version });
  } catch (e) {
    if (e?.response?.status === 409 && id) {
      try { const fresh = await api.getDesign(id); e.freshMeta = { id: fresh.id, version: fresh.version }; } catch { /* giữ lỗi gốc */ }
    }
    throw e;
  }
}
