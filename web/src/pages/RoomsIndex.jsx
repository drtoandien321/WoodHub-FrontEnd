import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRooms } from '../hooks/useCatalog.js';

// "Không gian" — điểm vào Shop by Room (FE-5): chọn 1 loại phòng để xem các cảnh (scene) tương ứng.
export default function RoomsIndex() {
  const { t } = useTranslation();
  const { data: rooms, isLoading, isError } = useRooms();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{t('rooms.title')}</h1>
        <p className="mt-2 max-w-2xl text-base-content/65">{t('rooms.subtitle')}</p>
      </div>

      {isError ? (
        <p className="rounded-xl bg-error/10 p-4 text-sm text-error">{t('rooms.loadError')}</p>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
        </div>
      ) : !rooms?.length ? (
        <p className="rounded-2xl border border-dashed border-base-300 p-10 text-center text-base-content/55">{t('rooms.noRooms')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {rooms.map((r) => (
            <Link
              key={r.id}
              to={`/rooms/${r.slug}`}
              className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[0_16px_40px_rgba(76,52,36,0.12)]"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl text-primary transition-transform group-hover:scale-110">🛋️</span>
              <span className="font-display text-lg">{r.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
