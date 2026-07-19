/*
 * Mock cho nhánh "Mẫu 3D / Upload (AI)" — shape khớp Model3dResponse / Ai3DTaskResponse thật
 * của BE (backend/docs/api-guide-fe.md mục 1), để bật VITE_USE_MOCK=false không phải sửa UI:
 *   { id, slug, source: 'template'|'ai_generated'|'uploaded', name, description, productType,
 *     modelGlbUrl, modelUsdzUrl, posterUrl, metadata, editableOptions, isPublic, createdAt }
 * - MODELS_3D: thư viện mẫu dựng sẵn (source='template'). glbUrl trỏ tới model mẫu chuẩn của
 *   Khronos (chỉ để dev có model THẬT render được). Khi có asset của team → thay bằng /models/*.glb.
 * - buildGeneratedModel: dựng record model (source='ai_generated') khi 1 AI task 'succeeded'.
 * - editableOptions: đặt theo bộ vật liệu sẵn có ở customData.js (WOOD_MATERIALS) — model nào
 *   không có editableOptions.materials (rỗng) nghĩa là KHÔNG hỗ trợ chỉnh sửa (xem FE-2 bước 5).
 */
const img = (p) => encodeURI(p);
const GLB = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

/*
 * editableOptions — quy ước dùng chung cho FE-2 bước 5 (không phải field cứng của BE, JSONB tự do):
 *   colors: string[] (hex) | materials: string[] (id khớp WOOD_MATERIALS) |
 *   dimensions: { width:[min,max], height:[min,max], depth:[min,max] } (cm, đơn vị nào có mặt mới cho chỉnh)
 * Thiếu/rỗng key nào → KHÔNG render control cho key đó (đúng yêu cầu "không cho chỉnh thuộc tính BE không hỗ trợ").
 */
const DEFAULT_EDITABLE = {
  colors: ['#c8a165', '#5d4030', '#d9c7a7', '#e0c694'],
  materials: ['oak', 'walnut', 'ash', 'pine'],
  dimensions: { width: [60, 220], height: [40, 120], depth: [40, 100] },
};

export const MODELS_3D = [
  {
    id: 'm1', slug: 'sofa-nhung', source: 'template', name: 'Sofa nhung 2 chỗ', description: null, productType: 'sofa',
    modelGlbUrl: `${GLB}/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb`, modelUsdzUrl: null,
    posterUrl: img('/mockdataimage/Bàn trà gỗ tràm mặt kính.jpg'),
    metadata: {}, editableOptions: DEFAULT_EDITABLE, isPublic: true, createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'm2', slug: 'ghe-boc-nem', source: 'template', name: 'Ghế bọc nệm', description: null, productType: 'chair',
    modelGlbUrl: `${GLB}/SheenChair/glTF-Binary/SheenChair.glb`, modelUsdzUrl: null,
    posterUrl: img('/mockdataimage/Ghế ăn gỗ cao su.jpg'),
    metadata: {}, editableOptions: DEFAULT_EDITABLE, isPublic: true, createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'm3', slug: 'sofa-go-boc-da', source: 'template', name: 'Sofa gỗ bọc da', description: null, productType: 'sofa',
    modelGlbUrl: `${GLB}/SheenWoodLeatherSofa/glTF-Binary/SheenWoodLeatherSofa.glb`, modelUsdzUrl: null,
    posterUrl: img('/image/lamviec1.png'),
    metadata: {}, editableOptions: DEFAULT_EDITABLE, isPublic: true, createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'm4', slug: 'den-trang-tri', source: 'template', name: 'Đèn trang trí', description: null, productType: 'decor',
    modelGlbUrl: `${GLB}/Lantern/glTF-Binary/Lantern.glb`, modelUsdzUrl: null,
    posterUrl: img('/mockdataimage/Kệ tivi gỗ óc chó 1m8.jpg'),
    // Décor: không cho đổi vật liệu gỗ (khác sofa/ghế) — demo trường hợp editableOptions rỗng
    metadata: {}, editableOptions: { colors: [], materials: [] }, isPublic: true, createdAt: '2026-06-01T00:00:00Z',
  },
];

// Model sinh ra khi 1 AI generation task 'succeeded' (demo dùng tạm 1 glb mẫu có sẵn).
export const buildGeneratedModel = (taskId, sourceName) => ({
  id: `gen_${taskId}`,
  slug: `gen-${taskId}`,
  source: 'ai_generated',
  name: sourceName ? `Thiết kế từ: ${sourceName}` : 'Thiết kế từ ảnh của bạn',
  description: null,
  productType: null,
  modelGlbUrl: MODELS_3D[1].modelGlbUrl,
  modelUsdzUrl: null,
  posterUrl: null,
  metadata: {},
  editableOptions: DEFAULT_EDITABLE,
  isPublic: false,
  createdAt: new Date().toISOString(),
});
