/*
 * designSnapshot — đọc `designSnapshot` của QuoteRequest / CustomOrder (BE-02, QuoteServiceImpl.buildDesignSnapshot).
 *
 * BE trả dạng PHẲNG: các key configuration của thiết kế (color, material, dimensions…) nằm ngay gốc, cộng 1 key
 * `design` = { designName, modelId, modelSlug, posterUrl, modelGlbUrl, sourceType, prompt } để xưởng biết khách muốn
 * làm món gì. (Lỗi cũ: FE đọc snapshot.thumbnailUrl / snapshot.configuration.material — 2 key BE KHÔNG có → NCC mở
 * báo giá không thấy sản phẩm, chỉ thấy số lượng + địa chỉ.)
 */
export function readDesignSnapshot(snapshot) {
  const { design, ...configuration } = snapshot ?? {};
  const info = design ?? {};
  return {
    name: info.designName ?? null,
    posterUrl: info.posterUrl ?? null,
    glbUrl: info.modelGlbUrl ?? null,
    modelSlug: info.modelSlug ?? null,
    sourceType: info.sourceType ?? null, // image | text (AI) · template | uploaded
    prompt: info.prompt ?? null,
    configuration,
  };
}
