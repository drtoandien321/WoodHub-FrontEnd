import { useRef, useState } from 'react';
import { useUploadSupplierImage } from '../../hooks/useSupplierPortal.js';
import { apiErrorMessage } from '../../utils/apiError.js';

const MAX_MB = 10;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/*
 * ImageUploadField — chọn ảnh từ máy → POST /uploads/image?purpose=… (BE-10) → trả url cho onChange(url).
 * Kiểm tra trước ở FE (loại file, ≤ 10MB) để khỏi tải lên rồi mới bị BE từ chối. Nơi dùng quyết định lưu url
 * vào đâu (PATCH /suppliers/me logoUrl/coverUrl, hoặc imageUrl của portfolio). onChange('') = gỡ ảnh.
 *
 * shape: 'square' (logo) | 'wide' (ảnh bìa 3:1) — chỉ đổi khung xem trước.
 */
export default function ImageUploadField({ label, purpose, value, onChange, shape = 'square', hint, disabled }) {
  const inputRef = useRef(null);
  const upload = useUploadSupplierImage();
  const [error, setError] = useState('');
  const busy = upload.isPending || disabled;

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // chọn lại đúng file đó vẫn kích hoạt onChange
    if (!file) return;
    setError('');
    if (!ACCEPT.split(',').includes(file.type)) { setError('Chỉ nhận ảnh JPEG, PNG, WEBP hoặc GIF.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`Ảnh tối đa ${MAX_MB}MB.`); return; }
    upload.mutate({ file, purpose }, {
      onSuccess: ({ url }) => onChange(url),
      onError: (err) => setError(apiErrorMessage(err, 'Tải ảnh lên chưa được, vui lòng thử lại.')),
    });
  };

  const frame = shape === 'wide' ? 'aspect-[3/1] w-full' : 'h-24 w-24';

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-base-content/70">{label}</span>}
      <div className={`flex gap-3 ${shape === 'wide' ? 'flex-col' : 'items-center'}`}>
        <div className={`${frame} relative shrink-0 overflow-hidden rounded-xl border border-dashed border-base-300 bg-base-200`}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : (
            <span className="grid h-full w-full place-items-center text-xs text-base-content/70">Chưa có ảnh</span>
          )}
          {upload.isPending && <span className="absolute inset-0 grid place-items-center bg-base-100/70"><span className="loading loading-spinner loading-sm" /></span>}
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn btn-outline btn-sm">
              {value ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
            {value && <button type="button" onClick={() => onChange('')} disabled={busy} className="btn btn-ghost btn-sm text-error">Gỡ ảnh</button>}
          </span>
          <span className="text-xs text-base-content/70">{hint ?? `JPEG/PNG/WEBP/GIF, tối đa ${MAX_MB}MB.`}</span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={pick} />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
