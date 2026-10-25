import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client.js';
import { useMaterials } from '../../hooks/useCatalog.js';
import { useRetextureModel, useModelVariants, useGenTask, useRetryGenTask } from '../../hooks/useModels3d.js';
import { useMyUsage, usableCount } from '../../hooks/useSubscription.js';
import { apiErrorMessage } from '../../utils/apiError.js';

/*
 * AiMaterialPanel — "Áp dụng chất liệu" bằng AI (BE-05 retexture, docs BE retexture-fe.md) ở bước 5 Custom Studio.
 *
 * Khác ô "Chất liệu / Màu" bên dưới (chỉ TÔ MÀU trên trình duyệt), đây là AI vẽ lại vân bề mặt của chính model → ra một
 * model BIẾN THỂ thật (lưu thiết kế sẽ dùng biến thể đó).
 *  - Chỉ hiện vật liệu có retexturePrompt (vật liệu khác BE trả 400).
 *  - POST /custom/models/{id}/variants: 200 = biến thể đã có → đổi model ngay, KHÔNG trừ lượt; 202 = AI đang làm →
 *    poll task (như luồng sinh 3D) → xong thì tải model biến thể theo slug. 429 = hết lượt tháng này.
 *  - Luôn gọi trên model GỐC (parentModelId) để không tạo "biến thể của biến thể"; vật liệu đã có biến thể → nhãn "Có sẵn".
 *  - Lượt còn lại: GET /usage/me feature "retexture".
 */
export default function AiMaterialPanel({ model, onModelChange }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const baseId = model?.parentModelId ?? model?.id;
  const { data: materialsData } = useMaterials();
  const { data: variants = [] } = useModelVariants(baseId);
  const { data: usage } = useMyUsage();
  const retexture = useRetextureModel();
  const retry = useRetryGenTask();
  const [taskId, setTaskId] = useState(null);
  const [pickedId, setPickedId] = useState(null);
  const [err, setErr] = useState('');
  const task = useGenTask(taskId);

  const materials = (materialsData?.content ?? materialsData ?? []).filter((m) => m.retexturePrompt);
  const u = usage?.find?.((x) => x.feature === 'retexture');
  const left = u ? usableCount(u) : null;
  const hasVariant = (materialId) => variants.some((v) => v.variantKey === `material:${materialId}`);
  const activeMaterial = model?.variantKey?.startsWith('material:') ? model.variantKey.slice('material:'.length) : null;

  // Task xong → tải model biến thể theo slug rồi thay vào studio
  useEffect(() => {
    const d = task.data;
    if (!d) return;
    if (d.status === 'succeeded' && d.modelSlug) {
      api.getModel3d(d.modelSlug).then((m) => {
        onModelChange(m);
        setTaskId(null);
        qc.invalidateQueries({ queryKey: ['modelVariants', baseId] });
        qc.invalidateQueries({ queryKey: ['myUsage'] });
      }).catch((e) => setErr(apiErrorMessage(e, t('custom.retexture.loadFailed'))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.data?.status, task.data?.modelSlug]);

  if (!materials.length || !baseId) return null;

  const apply = (m) => {
    setErr(''); setPickedId(m.id);
    retexture.mutate({ modelId: baseId, materialId: m.id }, {
      onSuccess: (res) => {
        if (res.state === 'ready' && res.model) { onModelChange(res.model); return; }
        setTaskId(res.taskId);
        qc.invalidateQueries({ queryKey: ['myUsage'] });
      },
      onError: (e) => setErr(e?.response?.status === 429 ? t('custom.retexture.outOfCredits') : apiErrorMessage(e, t('custom.retexture.failed'))),
    });
  };
  const resetToOriginal = () => {
    if (!model.parentModelId) return;
    api.getModel3d(model.parentModelId).then(onModelChange).catch(() => {});
  };

  const running = !!taskId && !['succeeded', 'failed', 'cancelled'].includes(task.data?.status);
  const failed = task.data?.status === 'failed';

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-medium">{t('custom.retexture.title')}</h3>
        {left != null && <span className="text-xs text-base-content/70">{left === Infinity ? t('custom.retexture.unlimited') : t('custom.retexture.left', { count: left })}</span>}
      </div>
      <p className="mb-3 text-xs text-base-content/70">{t('custom.retexture.hint')}</p>
      <div className="flex flex-wrap gap-2">
        {materials.map((m) => {
          const active = activeMaterial === m.id;
          return (
            <button key={m.id} type="button" onClick={() => apply(m)} disabled={running || retexture.isPending || active}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? 'border-primary bg-primary text-primary-content' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}>
              {retexture.isPending && pickedId === m.id && <span className="loading loading-spinner loading-xs" />}
              {m.name}
              {hasVariant(m.id) && !active && <span className="rounded-full bg-success/15 px-1.5 text-[10px] text-success">{t('custom.retexture.ready')}</span>}
            </button>
          );
        })}
      </div>
      {running && (
        <div className="mt-3 flex flex-col gap-1">
          <progress className="progress progress-primary w-full" value={task.data?.progress ?? 0} max="100" />
          <p className="text-xs text-base-content/70">{t('custom.retexture.processing', { progress: task.data?.progress ?? 0 })}</p>
        </div>
      )}
      {failed && (
        <p className="mt-3 text-xs text-error">
          {t('custom.retexture.taskFailed')}{' '}
          <button type="button" onClick={() => retry.mutate(taskId)} disabled={retry.isPending} className="link">{t('custom.retexture.retry')}</button>
        </p>
      )}
      {model.parentModelId && !running && (
        <button type="button" onClick={resetToOriginal} className="btn btn-ghost btn-xs mt-2">{t('custom.retexture.original')}</button>
      )}
      {err && <p className="mt-2 text-xs text-error">{err}</p>}
    </section>
  );
}
