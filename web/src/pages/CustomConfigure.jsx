import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfiguratorStore } from '../stores/configuratorStore.js';
import { useSaveDesign } from '../hooks/useProducts.js';
import { useAuthStore } from '../stores/authStore.js';
import Configurator3D from '../components/configurator/Configurator3D.jsx';
import ControlPanel from '../components/configurator/ControlPanel.jsx';

export default function CustomConfigure() {
  const { type } = useParams();
  const navigate = useNavigate();
  const initForType = useConfiguratorStore((s) => s.initForType);
  const token = useAuthStore((s) => s.token);
  const saveDesign = useSaveDesign();

  // Đổi loại sản phẩm (URL đổi) → reset store về defaults của loại đó
  useEffect(() => { initForType(type); }, [type, initForType]);

  const handleSave = async () => {
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
        <ControlPanel onSave={handleSave} saving={saveDesign.isPending} />
      </aside>
    </div>
  );
}
