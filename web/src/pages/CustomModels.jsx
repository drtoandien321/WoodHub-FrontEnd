import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModels3d, useGenerate3D, useGenTask } from '../hooks/useModels3d.js';
import ModelCard from '../components/custom3d/ModelCard.jsx';

/*
 * Gallery mẫu 3D + ô upload ảnh → dựng 3D (mock Meshy).
 * Luồng upload: chọn ảnh → generate3D (lấy taskId) → useGenTask poll tới 'succeeded' → sang viewer.
 */
export default function CustomModels() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useModels3d();
  const generate = useGenerate3D();
  const fileRef = useRef(null);

  const [taskId, setTaskId] = useState(null);
  const [preview, setPreview] = useState(null); // ảnh user vừa upload (object URL)
  const { data: task } = useGenTask(taskId);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Dựng xong → điều hướng sang trang viewer của model mới sinh
  useEffect(() => {
    if (task?.status === 'succeeded' && task.modelSlug) navigate(`/custom/models/${task.modelSlug}`);
  }, [task, navigate]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    generate.mutate({ imageName: file.name }, { onSuccess: (res) => setTaskId(res.taskId) });
    e.target.value = '';
  };

  const busy = generate.isPending || (!!taskId && task?.status !== 'succeeded');
  const progress = task?.progress ?? (generate.isPending ? 5 : 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link to="/custom" className="text-sm text-base-content/55 hover:text-primary">← {t('nav.custom')}</Link>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">{t('custom.ai.galleryTitle')}</h1>
        <p className="mt-2 max-w-2xl text-base-content/65">{t('custom.ai.gallerySubtitle')}</p>
      </div>

      {/* Grid: ô upload + các mẫu */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Upload tile */}
        <button
          onClick={() => fileRef.current?.click()}
          className="group flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-base-300 bg-base-200/40 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </span>
          <div>
            <p className="font-display text-lg">{t('custom.ai.uploadTitle')}</p>
            <p className="mt-0.5 text-xs text-base-content/55">{t('custom.ai.uploadDesc')}</p>
          </div>
          <span className="btn btn-primary btn-sm pointer-events-none mt-1">{t('custom.ai.uploadCta')}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

        {/* Mẫu dựng sẵn */}
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)
          : data?.items?.map((m) => <ModelCard key={m.id} model={m} />)}
      </div>

      {/* Modal tiến trình dựng 3D */}
      {busy && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-3xl bg-base-100 text-center">
            {preview && <img src={preview} alt="" className="mx-auto mb-4 h-32 w-32 rounded-2xl object-cover" />}
            <h3 className="font-display text-lg">{t('custom.ai.generating')}</h3>
            <progress className="progress progress-primary mt-4 w-full" value={progress} max="100" />
            <p className="mt-1 text-sm text-base-content/55">{progress}%</p>
            <p className="mt-3 text-xs text-base-content/50">{t('custom.ai.generatingHint')}</p>
          </div>
          <div className="modal-backdrop bg-black/40" />
        </div>
      )}
    </div>
  );
}
