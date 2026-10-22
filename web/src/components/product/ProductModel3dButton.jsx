import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModelViewer from '../custom3d/ModelViewer.jsx';
import ModalShell from '../admin/ModalShell.jsx';

/*
 * Nút "Xem 3D / AR" ở trang sản phẩm — chỉ hiện khi admin đã gắn mẫu 3D cho SP (ProductResponse.model3d, docs BE
 * admin-product-model3d-fe.md §4). Mở <model-viewer> (src = GLB, ios-src = USDZ cho AR trên iPhone, poster).
 * Mẫu có editableOptions → thêm link "Tuỳ chỉnh thiết kế" sang trang mẫu trong thư viện custom (/custom/models/:slug).
 * ModelViewer tự import('@google/model-viewer') khi mount → three.js chỉ tải khi khách bấm mở.
 */
export default function ProductModel3dButton({ product }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const m = product?.model3d;
  if (!m?.modelGlbUrl) return null;
  const customizable = Object.keys(m.editableOptions ?? {}).length > 0;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-primary gap-2">
        <span aria-hidden="true">🧊</span> {t('product.view3d')}
      </button>
      {open && (
        <ModalShell
          open
          onClose={() => setOpen(false)}
          title={m.name || product.name}
          maxWidth="max-w-3xl"
          footer={(
            <>
              {customizable && <Link to={`/custom/models/${m.slug}`} className="btn btn-outline btn-sm">{t('product.customize3d')}</Link>}
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">{t('product.close3d')}</button>
            </>
          )}
        >
          <div className="h-[60vh] w-full overflow-hidden rounded-xl bg-base-200">
            <ModelViewer src={m.modelGlbUrl} iosSrc={m.modelUsdzUrl ?? undefined} poster={m.posterUrl} alt={product.name} showControls />
          </div>
          <p className="mt-2 text-xs text-base-content/55">{t('product.view3dHint')}</p>
        </ModalShell>
      )}
    </>
  );
}
