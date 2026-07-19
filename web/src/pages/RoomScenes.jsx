import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRoomBySlug, useRoomScenes } from '../hooks/useRoomScenes.js';

// Danh sách "cảnh" (scene) của 1 phòng — mỗi phòng có thể có nhiều ảnh không gian khác nhau.
export default function RoomScenes() {
  const { roomSlug } = useParams();
  const { t } = useTranslation();
  const { data: room, isLoading: roomLoading, isError: roomError } = useRoomBySlug(roomSlug);
  const { data: scenes, isLoading: scenesLoading, isError: scenesError } = useRoomScenes(roomSlug);

  if (roomLoading || scenesLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] rounded-2xl" />)}
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-2xl">{t('rooms.roomNotFound')}</p>
        <Link to="/rooms" className="btn btn-primary mt-5">{t('rooms.backToRooms')}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/rooms" className="text-sm text-base-content/55 hover:text-primary">← {t('rooms.title')}</Link>
        <h1 className="mt-1 font-display text-3xl">{room.name}</h1>
      </div>

      {scenesError ? (
        <p className="rounded-xl bg-error/10 p-4 text-sm text-error">{t('rooms.loadError')}</p>
      ) : !scenes?.length ? (
        <p className="rounded-2xl border border-dashed border-base-300 p-10 text-center text-base-content/55">{t('rooms.noScenes')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((s) => (
            <Link
              key={s.id}
              to={`/rooms/${roomSlug}/scenes/${s.id}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-[#e7dcc6] to-[#bfa988]"
            >
              {s.backgroundImageUrl && (
                <img src={s.backgroundImageUrl} alt={s.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 text-left font-display text-lg text-white">
                {s.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
