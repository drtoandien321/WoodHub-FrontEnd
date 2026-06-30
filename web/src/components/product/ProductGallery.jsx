import { useState } from 'react';
import { ChevronLeft, ChevronRight } from '../suppliers/icons.jsx';

/*
 * ProductGallery — ảnh lớn + thumbnail (cột trái trang sản phẩm).
 * - images: string[] (luôn ≥1, đã có fallback ở adapter). alt: tên SP.
 * - badge: { label, tone:'accent'|'error' } | null — "Bán chạy" / "Hết hàng".
 * - prev/next vòng tròn, indicator i/n, thumbnail active có viền nâu. Mobile: thumbnail scroll ngang.
 */
export default function ProductGallery({ images = [], alt = '', badge }) {
  const list = images.length ? images : [''];
  const [active, setActive] = useState(0);
  const safe = Math.min(active, list.length - 1);

  const go = (dir) => setActive((i) => (i + dir + list.length) % list.length);

  return (
    <div className="flex flex-col gap-3">
      <figure className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-base-200">
        <img
          src={list[safe]}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
              badge.tone === 'error' ? 'bg-error text-error-content' : 'bg-accent text-accent-content'
            }`}
          >
            {badge.label}
          </span>
        )}

        {list.length > 1 && (
          <>
            <button
              type="button" onClick={() => go(-1)} aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-base-100/85 text-base-content shadow backdrop-blur transition hover:bg-base-100"
            >
              <ChevronLeft width={18} height={18} />
            </button>
            <button
              type="button" onClick={() => go(1)} aria-label="Ảnh sau"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-base-100/85 text-base-content shadow backdrop-blur transition hover:bg-base-100"
            >
              <ChevronRight width={18} height={18} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
              {safe + 1} / {list.length}
            </span>
          </>
        )}
      </figure>

      {list.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className={`aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === safe ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
