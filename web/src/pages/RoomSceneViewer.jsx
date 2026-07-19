import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRoomSceneDetail } from '../hooks/useRoomScenes.js';
import { useCartStore } from '../stores/cartStore.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import { formatVnd } from '../utils/format.js';

/*
 * RoomSceneViewer — 1 "cảnh" không gian (ảnh + hotspot sản phẩm), FE-5/BE-7.
 * Hotspot lấy toạ độ % TỪ BACKEND (item.xPercent/yPercent) — KHÔNG hardcode vị trí ở FE.
 * Ảnh lỗi hoặc scene không có hotspot nào → fallback sang lưới sản phẩm thường (ProductCard).
 */
export default function RoomSceneViewer() {
  const { sceneId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: scene, isLoading, isError } = useRoomSceneDetail(sceneId);
  const addItem = useCartStore((s) => s.addItem);
  const [imgError, setImgError] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // hotspot đang mở preview

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton aspect-video w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !scene) {
    return (
      <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-2xl">{t('rooms.sceneNotFound')}</p>
        <Link to="/rooms" className="btn btn-primary mt-5">{t('rooms.backToRooms')}</Link>
      </div>
    );
  }

  const useFallback = imgError || !scene.items.length;

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-base-content/55">
        <Link to="/rooms" className="hover:text-primary">{t('rooms.title')}</Link>
        <span>/</span>
        {scene.room && <Link to={`/rooms/${scene.room.slug}`} className="hover:text-primary">{scene.room.name}</Link>}
        <span>/</span>
        <span className="font-medium text-base-content/80">{scene.name}</span>
      </nav>

      {useFallback ? (
        <div className="flex flex-col gap-4">
          {imgError && <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning-content">{t('rooms.imageError')}</p>}
          <h1 className="font-display text-2xl">{scene.name}</h1>
          {scene.items.length === 0 ? (
            <p className="text-base-content/60">{t('rooms.noProducts')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {scene.items.map((item) => <ProductCard key={item.id} product={item.product} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full overflow-hidden rounded-3xl border border-base-300 bg-base-200">
          <img
            src={scene.backgroundImageUrl}
            alt={scene.name}
            className="block w-full"
            onError={() => setImgError(true)}
          />
          {scene.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveItem(item)}
              aria-label={t('rooms.hotspotLabel', { name: item.product.name })}
              style={{ left: `${item.xPercent}%`, top: `${item.yPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-primary/90 text-primary-content shadow-lg transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:animate-pulse"
            >
              <span className="text-sm font-bold leading-none">+</span>
            </button>
          ))}
        </div>
      )}

      {/* Preview khi bấm hotspot */}
      {activeItem && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm rounded-3xl p-0 overflow-hidden">
            <button onClick={() => setActiveItem(null)} aria-label={t('rooms.close')} className="btn btn-ghost btn-sm btn-circle absolute right-2 top-2 z-10 bg-base-100/80">✕</button>
            {activeItem.product.primaryImageUrl && (
              <img src={activeItem.product.primaryImageUrl} alt={activeItem.product.name} className="h-48 w-full object-cover" />
            )}
            <div className="flex flex-col gap-2 p-5">
              <h3 className="font-display text-lg">{activeItem.product.name}</h3>
              <p className="text-sm text-base-content/60">{activeItem.product.supplierName}</p>
              <p className="text-xl font-semibold text-primary">{formatVnd(activeItem.product.priceFrom)}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => { addItem({ ...activeItem.product, price: activeItem.product.priceFrom, image: activeItem.product.primaryImageUrl }, 1); setActiveItem(null); }}
                  className="btn btn-outline btn-sm flex-1 border-base-300"
                >
                  {t('product.addToCart')}
                </button>
                <button onClick={() => navigate(`/product/${activeItem.product.id}`)} className="btn btn-primary btn-sm flex-1">
                  {t('rooms.viewDetail')}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setActiveItem(null)} />
        </div>
      )}
    </div>
  );
}
