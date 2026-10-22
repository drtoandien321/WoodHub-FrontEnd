import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModelViewer from '../custom3d/ModelViewer.jsx';
import ModalShell from '../admin/ModalShell.jsx';
import { readDesignSnapshot } from '../../utils/designSnapshot.js';
import { NAMED_COLORS, MATERIAL_TINT } from '../../utils/modelOptions.js';

const AXES = ['width', 'depth', 'height'];

/*
 * Thẻ "Sản phẩm khách yêu cầu" ở chi tiết báo giá / đơn custom — dùng chung 2 vai, quan trọng nhất cho XƯỞNG để biết
 * phải làm gì: ảnh mô hình, tên thiết kế, nguồn (AI từ ảnh / mô tả, mẫu thư viện…), mô tả gốc khách nhập (prompt),
 * màu + chất liệu + kích thước đã chọn, và nút xem mô hình 3D (nhuộm đúng màu khách chọn).
 * Dữ liệu lấy từ designSnapshot (bản chụp lúc gửi báo giá) chứ không gọi /custom-designs/{id}: thiết kế là của khách,
 * xưởng không có quyền đọc, và khách có sửa thiết kế sau đó thì báo giá vẫn giữ đúng bản đã gửi.
 */
export default function DesignSnapshotCard({ snapshot, quantity, children }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const d = readDesignSnapshot(snapshot);
  const { color, material, dimensions, ...rest } = d.configuration;
  // Key cấu hình khác (nếu sau này BE/FE thêm) — vẫn hiện thô để xưởng không bỏ sót yêu cầu
  const extras = Object.entries(rest).filter(([, v]) => v != null && v !== '' && typeof v !== 'object');
  const colorHex = color ? (String(color).startsWith('#') ? color : NAMED_COLORS[color] ?? null) : null;
  const tint = colorHex ?? MATERIAL_TINT[material] ?? null;
  const dims = dimensions && AXES.some((a) => dimensions[a]) ? dimensions : null;

  return (
    <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => d.glbUrl && setOpen(true)}
          disabled={!d.glbUrl}
          className="group relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-base-200"
          aria-label={t('quote.design.view3d')}
        >
          {d.posterUrl
            ? <img src={d.posterUrl} alt={d.name ?? ''} className="h-full w-full object-cover" />
            : <span className="flex h-full items-center justify-center text-3xl text-base-content/30">🪑</span>}
          {d.glbUrl && (
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-xs font-medium text-white opacity-90 group-hover:opacity-100">
              🧊 {t('quote.design.view3d')}
            </span>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-base-content/50">{t('quote.design.title')}</p>
            <p className="font-display text-xl">{d.name || t('quote.design.untitled')}</p>
            {d.sourceType && <p className="text-xs text-base-content/55">{t(`quote.design.source.${d.sourceType}`, { defaultValue: d.sourceType })}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {quantity != null && <Field label={t('quote.quantity')} value={quantity} />}
            {material && <Field label={t('product.material')} value={t(`custom.materials.${material}`, { defaultValue: material })} />}
            {color && (
              <Field
                label={t('custom.studio.step5.colorTitle')}
                value={(
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ background: colorHex ?? 'repeating-linear-gradient(45deg, #f3ede3 0 3px, #d6c8b2 3px 6px)' }}
                    />
                    {t(`custom.colors.${color}`, { defaultValue: color })}
                  </span>
                )}
              />
            )}
            {dims && <Field label={t('product.size')} value={AXES.map((a) => dims[a] ?? '—').join(' × ') + ' cm'} hint={t('quote.design.dimsHint')} />}
            {extras.map(([k, v]) => <Field key={k} label={k} value={String(v)} />)}
            {children}
          </div>

          {d.prompt && (
            <div className="rounded-xl bg-base-200/60 p-3 text-sm">
              <p className="text-xs text-base-content/50">{t('quote.design.prompt')}</p>
              <p className="mt-0.5 text-base-content/80">“{d.prompt}”</p>
            </div>
          )}
        </div>
      </div>

      {open && (
        <ModalShell
          open
          onClose={() => setOpen(false)}
          title={d.name || t('quote.design.title')}
          maxWidth="max-w-3xl"
          footer={<button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">{t('product.close3d')}</button>}
        >
          <ModelViewer src={d.glbUrl} poster={d.posterUrl ?? undefined} alt={d.name ?? ''} color={tint} className="h-[60vh] w-full rounded-xl bg-base-200" showControls />
          <p className="mt-2 text-xs text-base-content/55">{t('quote.design.view3dHint')}</p>
        </ModalShell>
      )}
    </div>
  );
}

function Field({ label, value, hint }) {
  return (
    <div>
      <p className="text-base-content/50">{label}</p>
      <p className="font-medium">{value}</p>
      {hint && <p className="text-xs text-base-content/45">{hint}</p>}
    </div>
  );
}
