import { Link } from 'react-router-dom';
import { useProductTypes } from '../hooks/useProducts.js';

export default function CustomSelect() {
  const { data, isLoading } = useProductTypes();

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl mb-2">Bạn muốn thiết kế gì?</h1>
        <p className="text-base-content/70 text-sm">Chọn loại sản phẩm để mở bộ cấu hình 3D — chỉnh kích thước, chất liệu, màu theo ý bạn.</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.items?.map((t) => (
            <Link key={t.id} to={`/custom/configure/${t.id}`} className="card bg-base-200 border border-base-300 hover:border-primary hover:shadow-lg transition-all p-6 items-center text-center gap-2">
              <span className="text-4xl">{t.emoji}</span>
              <h3 className="font-medium">{t.name}</h3>
              <p className="text-xs text-base-content/60">{t.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
