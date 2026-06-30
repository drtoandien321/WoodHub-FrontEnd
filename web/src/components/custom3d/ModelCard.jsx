import { Link } from 'react-router-dom';

/*
 * Card 1 mẫu 3D trong gallery. Ảnh poster có fallback gradient gỗ nếu thiếu/lỗi.
 * Bấm vào → trang viewer /custom/models/:slug.
 */
export default function ModelCard({ model }) {
  return (
    <Link
      to={`/custom/models/${model.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[0_16px_40px_rgba(76,52,36,0.12)]"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#e7dcc6] to-[#bfa988]">
        {model.poster && (
          <img
            src={model.poster}
            alt={model.name}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-base-100/85 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur-sm">
          {model.category}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-content">3D</span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg leading-tight">{model.name}</h3>
      </div>
    </Link>
  );
}
