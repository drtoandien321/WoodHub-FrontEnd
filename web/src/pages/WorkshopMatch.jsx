import { useParams, Link } from 'react-router-dom';
import { useWorkshopMatch } from '../hooks/useProducts.js';
import EmptyState from '../components/ui/EmptyState.jsx';

/*
 * Ghép xưởng RULE-BASED (scope MVP): lọc theo năng lực khai báo + chấm điểm đơn giản.
 * Logic nằm trong mockAdapter.matchWorkshops — BE port y nguyên sang service.
 */
export default function WorkshopMatch() {
  const { designId } = useParams();
  const { data, isLoading } = useWorkshopMatch(designId);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl">Xưởng phù hợp với thiết kế của bạn</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Lọc theo năng lực sản xuất (loại sản phẩm, kích thước tối đa, vật liệu) và xếp hạng theo đánh giá, tốc độ, kinh nghiệm.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : data?.matches?.length ? (
        <div className="flex flex-col gap-3">
          {data.matches.map((w, idx) => (
            <div key={w.id} className="flex items-center gap-4 bg-base-200 rounded-2xl p-4 border border-base-300">
              <div className="radial-progress text-primary shrink-0" style={{ '--value': w.score, '--size': '3.5rem' }} role="progressbar">
                {w.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{w.name}</h3>
                  {idx === 0 && <span className="badge badge-accent badge-sm">Phù hợp nhất</span>}
                </div>
                <p className="text-sm text-base-content/60">{w.district} · ★ {w.rating} · {w.completedJobs} đơn hoàn thành · giao ~{w.leadTimeDays} ngày</p>
              </div>
              <button className="btn btn-primary btn-sm">Yêu cầu báo giá</button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa tìm thấy xưởng phù hợp" hint="Thử giảm kích thước hoặc đổi chất liệu trong thiết kế." ctaLabel="Sửa thiết kế" ctaTo="/custom" />
      )}

      <Link to="/custom" className="link link-primary text-sm">← Thiết kế sản phẩm khác</Link>
    </div>
  );
}
