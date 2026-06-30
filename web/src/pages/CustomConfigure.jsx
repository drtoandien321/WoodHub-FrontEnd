import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Vector3 } from 'three';
import { useConfiguratorStore } from '../stores/configuratorStore.js';
import { useSaveDesign } from '../hooks/useProducts.js';
import { useAuthStore } from '../stores/authStore.js';
import { useCartStore } from '../stores/cartStore.js';
import { WOOD_MATERIALS } from '../api/mock/customData.js';
import Configurator3D from '../components/configurator/Configurator3D.jsx';
import ControlPanel from '../components/configurator/ControlPanel.jsx';

// Ảnh thumbnail cho item custom trong giỏ: ô màu = màu gỗ đang chọn (không có ảnh sản phẩm thật)
const swatch = (hex) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' rx='10' fill='${hex}'/></svg>`
  )}`;

// Ảnh tham khảo "có sẵn" — sinh tại chỗ bằng SVG gradient tông gỗ, không cần asset ngoài
const refSample = (label, c1, c2) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>
      </linearGradient></defs>
      <rect width='200' height='150' rx='12' fill='url(#g)'/>
      <text x='100' y='80' font-family='sans-serif' font-size='15' fill='#fff' opacity='0.9'
        text-anchor='middle'>${label}</text>
    </svg>`
  )}`;

const SAMPLE_REFERENCES = [
  { id: 'r1', label: 'Bàn Scandinavian', src: refSample('Scandinavian', '#d8c09a', '#a87f4f') },
  { id: 'r2', label: 'Gỗ óc chó tối', src: refSample('Walnut', '#7a5230', '#3d2817') },
  { id: 'r3', label: 'Tối giản sáng', src: refSample('Minimal', '#efe7d8', '#cdb98f') },
  { id: 'r4', label: 'Cổ điển ấm', src: refSample('Classic', '#b98a55', '#6e451f') },
];

export default function CustomConfigure() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initForType = useConfiguratorStore((s) => s.initForType);
  const token = useAuthStore((s) => s.token);
  const addItem = useCartStore((s) => s.addItem);
  const saveDesign = useSaveDesign();
  const [savedMsg, setSavedMsg] = useState(false);

  // --- State / ref cho phần UI mới (chỉ phục vụ hiển thị, không đụng tới logic cấu hình) ---
  const controlsRef = useRef(null);      // tham chiếu tới OrbitControls để toolbar điều khiển camera
  const fileInputRef = useRef(null);     // input file ẩn cho nút "Tải ảnh lên"
  const [refImage, setRefImage] = useState(null); // ảnh tham khảo đang chọn (URL)
  const [pickerOpen, setPickerOpen] = useState(false); // mở modal "Chọn ảnh có sẵn"
  const [rotating, setRotating] = useState(false);      // trạng thái xoay tự động (active của nút Xoay)

  // Đổi loại sản phẩm (URL đổi) → reset store về defaults của loại đó
  useEffect(() => { initForType(type); }, [type, initForType]);

  // Giải phóng object URL khi ảnh tham khảo bị thay/khi rời trang để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => { if (refImage?.startsWith('blob:')) URL.revokeObjectURL(refImage); };
  }, [refImage]);

  // --- Toolbar 3D: thao tác trực tiếp trên OrbitControls (không tạo state three riêng) ---
  const toggleRotate = () => {
    const c = controlsRef.current;
    if (!c) return;
    c.autoRotate = !c.autoRotate;
    c.autoRotateSpeed = 2.2;
    setRotating(c.autoRotate);
  };

  const zoomIn = () => {
    const c = controlsRef.current;
    if (!c) return;
    // Kéo camera lại gần target 18% mỗi lần bấm, không vượt khoảng cách tối thiểu của OrbitControls
    const offset = new Vector3().subVectors(c.object.position, c.target);
    offset.setLength(Math.max(c.minDistance, offset.length() * 0.82));
    c.object.position.copy(c.target).add(offset);
    c.update();
  };

  const resetView = () => {
    const c = controlsRef.current;
    if (!c) return;
    c.autoRotate = false;
    setRotating(false);
    c.reset(); // về đúng vị trí camera + target ban đầu
  };

  // --- Nguồn tham khảo: tải ảnh lên / chọn ảnh có sẵn ---
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (refImage?.startsWith('blob:')) URL.revokeObjectURL(refImage);
    setRefImage(URL.createObjectURL(file));
    e.target.value = ''; // cho phép chọn lại đúng file đó lần sau
  };

  const pickSample = (src) => {
    if (refImage?.startsWith('blob:')) URL.revokeObjectURL(refImage);
    setRefImage(src);
    setPickerOpen(false);
  };

  const clearReference = () => {
    if (refImage?.startsWith('blob:')) URL.revokeObjectURL(refImage);
    setRefImage(null);
  };

  // Lưu thiết kế + thêm vào giỏ. KHÔNG điều hướng đi đâu — chỉ hiện toast thành công.
  // Lưu ý: design lưu qua mock (in-memory + localStorage); item custom nằm trong cart (persist).
  const handleSave = async () => {
    const state = useConfiguratorStore.getState();
    const { productType, dimensions, materialId, finishId } = state;
    const design = await saveDesign.mutateAsync({ productType, dimensions, materialId, finishId });

    // Dựng 1 "sản phẩm custom" để bỏ vào giỏ — id riêng để mỗi lần lưu là 1 dòng giỏ độc lập
    const typeName = t(`custom.types.${productType}.name`);
    const matName = t(`custom.materials.${materialId}`);
    const hex = WOOD_MATERIALS.find((m) => m.id === materialId)?.hexColor ?? '#c8a165';
    addItem(
      {
        id: `custom_${design.id}`,
        name: `${t('custom.customPrefix')}: ${typeName} ${dimensions.width}×${dimensions.height}×${dimensions.depth}cm · ${matName}`,
        price: state.estimatePrice(),
        image: swatch(hex),
      },
      1
    );

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  // Luồng phụ (giữ nguyên như cũ): gửi thiết kế đi ghép xưởng — cần đăng nhập để yêu cầu báo giá
  const handleFindWorkshop = async () => {
    if (!token) return navigate('/login', { state: { from: { pathname: `/custom/configure/${type}` } } });
    const { productType, dimensions, materialId, finishId } = useConfiguratorStore.getState();
    const design = await saveDesign.mutateAsync({ productType, dimensions, materialId, finishId });
    navigate(`/custom/match/${design.id}`);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 min-h-[70vh]">
      {/* === KHU VỰC THIẾT KẾ 3D (trái) === */}
      <div className="custom-canvas relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#efe7d8] to-[#e0d3bc] border border-base-300/60 shadow-sm min-h-[420px] lg:min-h-0">
        <Configurator3D controlsRef={controlsRef} />

        {/* Floating card: Nguồn tham khảo (góc trên-trái, không che model ở giữa) */}
        <div className="absolute top-6 left-6 z-20 w-[19rem] max-w-[calc(100%-3rem)] rounded-[20px] border border-base-300/70 bg-base-100/70 backdrop-blur-md shadow-lg p-4">
          <p className="text-sm font-medium text-base-content/80 mb-3">{t('custom.referenceSource')}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary btn-sm flex-1 gap-1.5 normal-case"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t('custom.uploadImage')}
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="btn btn-sm flex-1 gap-1.5 normal-case border-primary/40 bg-base-100/50 text-primary hover:bg-primary/10 hover:border-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              {t('custom.chooseExisting')}
            </button>
          </div>

          {/* Preview ảnh tham khảo đã chọn */}
          {refImage && (
            <div className="relative mt-3">
              <img src={refImage} alt={t('custom.referenceSource')} className="w-full h-24 object-cover rounded-xl border border-base-300/70" />
              <button
                onClick={clearReference}
                aria-label={t('custom.removeReference')}
                className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-neutral shadow"
              >
                ✕
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        {/* Floating toolbar: điều khiển camera (giữa, dưới canvas) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border border-base-300/70 bg-base-100/80 backdrop-blur-md shadow-lg px-2 py-1.5">
          <button
            onClick={toggleRotate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-primary transition-colors ${rotating ? 'bg-primary/15' : 'hover:bg-primary/10'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
            </svg>
            {t('custom.toolRotate')}
          </button>
          <span className="w-px h-5 bg-base-300/70" />
          <button onClick={zoomIn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-primary transition-colors hover:bg-primary/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
            </svg>
            {t('custom.toolZoom')}
          </button>
          <span className="w-px h-5 bg-base-300/70" />
          <button onClick={resetView} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-primary transition-colors hover:bg-primary/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8" /><path d="M3 3v5h5" />
            </svg>
            {t('custom.toolReset')}
          </button>
        </div>
      </div>

      {/* === PANEL CẤU HÌNH (phải) === */}
      <aside className="bg-base-100 border border-base-300 rounded-3xl p-6 overflow-y-auto shadow-sm">
        <ControlPanel onSave={handleSave} onFindWorkshop={handleFindWorkshop} saving={saveDesign.isPending} />
      </aside>

      {/* Modal: Chọn ảnh có sẵn */}
      {pickerOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-100 rounded-3xl">
            <h3 className="font-semibold text-lg mb-4">{t('custom.chooseExistingTitle')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {SAMPLE_REFERENCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pickSample(s.src)}
                  className="group rounded-2xl overflow-hidden border border-base-300 hover:border-primary transition-colors text-left"
                >
                  <img src={s.src} alt={s.label} className="w-full h-28 object-cover" />
                  <span className="block px-3 py-2 text-sm text-base-content/80">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="modal-action">
              <button onClick={() => setPickerOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setPickerOpen(false)} />
        </div>
      )}

      {/* Toast xác nhận đã lưu + thêm vào giỏ */}
      {savedMsg && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success shadow-lg">
            <span>{t('custom.savedToast')}</span>
            <Link to="/cart" className="btn btn-sm">{t('custom.goToCart')}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
