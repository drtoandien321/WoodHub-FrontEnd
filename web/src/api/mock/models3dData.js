/*
 * Mock cho nhánh "Mẫu 3D / Upload (AI)".
 * - MODELS_3D: thư viện mẫu dựng sẵn (Phase 0). glbUrl hiện trỏ tới các model mẫu chuẩn của
 *   Khronos (chỉ để dev có model THẬT render được). Khi có asset của team → thay bằng /models/*.glb.
 * - buildGeneratedModel: dựng record model "ảo" cho luồng upload ảnh → Meshy (giả lập).
 *   Khi cắm Meshy thật, BE trả về glbUrl/usdzUrl thật theo đúng shape này.
 */
const img = (p) => encodeURI(p);
const GLB = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

export const MODELS_3D = [
  {
    id: 'm1', slug: 'sofa-nhung', name: 'Sofa nhung 2 chỗ', category: 'Sofa',
    glbUrl: `${GLB}/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb`,
    poster: img('/mockdataimage/Bàn trà gỗ tràm mặt kính.jpg'), defaultMaterialId: 'walnut',
  },
  {
    id: 'm2', slug: 'ghe-boc-nem', name: 'Ghế bọc nệm', category: 'Ghế',
    glbUrl: `${GLB}/SheenChair/glTF-Binary/SheenChair.glb`,
    poster: img('/mockdataimage/Ghế ăn gỗ cao su.jpg'), defaultMaterialId: 'oak',
  },
  {
    id: 'm3', slug: 'sofa-go-boc-da', name: 'Sofa gỗ bọc da', category: 'Sofa',
    glbUrl: `${GLB}/SheenWoodLeatherSofa/glTF-Binary/SheenWoodLeatherSofa.glb`,
    poster: img('/image/lamviec1.png'), defaultMaterialId: 'walnut',
  },
  {
    id: 'm4', slug: 'den-trang-tri', name: 'Đèn trang trí', category: 'Décor',
    glbUrl: `${GLB}/Lantern/glTF-Binary/Lantern.glb`,
    poster: img('/mockdataimage/Kệ tivi gỗ óc chó 1m8.jpg'), defaultMaterialId: 'ash',
  },
];

// Model sinh ra từ ảnh upload (demo dùng tạm 1 glb mẫu). Khi có Meshy thật → glbUrl/usdzUrl từ BE.
export const buildGeneratedModel = (taskId, sourceName) => ({
  id: `gen_${taskId}`,
  slug: `gen-${taskId}`,
  name: sourceName ? `Thiết kế từ: ${sourceName}` : 'Thiết kế từ ảnh của bạn',
  category: 'AI',
  glbUrl: MODELS_3D[1].glbUrl,
  usdzUrl: null,
  poster: '',
  defaultMaterialId: 'oak',
  generated: true,
});
