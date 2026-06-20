import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export default function CustomConfigure() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initForType = useConfiguratorStore((s) => s.initForType);
  const token = useAuthStore((s) => s.token);
  const addItem = useCartStore((s) => s.addItem);
  const saveDesign = useSaveDesign();
  const [savedMsg, setSavedMsg] = useState(false);

  // Đổi loại sản phẩm (URL đổi) → reset store về defaults của loại đó
  useEffect(() => { initForType(type); }, [type, initForType]);

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
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 min-h-[70vh]">
      {/* Canvas 3D — chiếm phần lớn màn hình, kéo xoay bằng chuột/cảm ứng */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#efe7d8] to-[#e0d3bc] min-h-[380px] lg:min-h-0">
        <Configurator3D />
      </div>
      <aside className="bg-base-100 border border-base-300 rounded-2xl p-5 overflow-y-auto">
        <ControlPanel onSave={handleSave} onFindWorkshop={handleFindWorkshop} saving={saveDesign.isPending} />
      </aside>

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
