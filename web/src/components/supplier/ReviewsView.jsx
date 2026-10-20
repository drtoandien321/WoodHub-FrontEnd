import { useState } from 'react';
import { useSupplierMe } from '../../hooks/useSupplierMe.js';
import { useMyProducts } from '../../hooks/useMyProducts.js';
import { useReviews, useReviewSummary, ratingDistribution } from '../../hooks/useReviews.js';
import Stars from '../suppliers/Stars.jsx';
import { Star } from '../suppliers/icons.jsx';
import { formatDate } from '../../utils/format.js';

const PAGE_SIZE = 20;

/*
 * ReviewsView — trang "Đánh giá khách hàng" của portal (dùng chung nhà cung cấp & xưởng), dữ liệu THẬT:
 *  - Cửa hàng: GET /reviews?targetType=supplier&targetId=<id từ /suppliers/me>
 *  - Sản phẩm (chỉ khi withProducts — nhà cung cấp có catalog): chọn 1 SP của mình → targetType=product
 * Điểm TB + tổng lượt lấy từ /reviews/summary; phân bố sao tính từ các đánh giá đã tải (BE không trả phân bố).
 * Bỏ nút "Phản hồi" của bản mock cũ: BE chưa có API trả lời đánh giá — không hiển thị chức năng không chạy được.
 */
export default function ReviewsView({ subtitle, withProducts = false }) {
  const { data: me, isLoading: meLoading } = useSupplierMe();
  const { data: myProducts } = useMyProducts({ size: 100 }, { enabled: withProducts });
  const products = myProducts?.content ?? [];
  const [tab, setTab] = useState('supplier'); // 'supplier' | 'product'
  const [productId, setProductId] = useState('');
  const [size, setSize] = useState(PAGE_SIZE);

  const targetType = tab;
  const targetId = tab === 'supplier' ? me?.id : productId || products[0]?.id;
  const { data, isLoading, isError, refetch } = useReviews(targetType, targetId, { size });
  const { data: summary } = useReviewSummary(targetType, targetId);
  // Chưa có đối tượng để xem (tab Sản phẩm mà NCC chưa có SP) → KHÔNG dùng `data`: placeholderData
  // của React Query vẫn giữ kết quả query trước (đánh giá cửa hàng) khi query mới bị tắt.
  const noTarget = !targetId;
  const reviews = noTarget ? [] : data?.content ?? [];
  const totalLoaded = data?.page?.totalElements ?? data?.totalElements ?? 0;
  const distribution = ratingDistribution(reviews);
  const count = noTarget ? 0 : summary?.count ?? 0;

  const switchTab = (next) => { setTab(next); setSize(PAGE_SIZE); };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Đánh giá khách hàng</h1>
        <p className="mt-1 text-base-content/60">{subtitle}</p>
      </header>

      {withProducts && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
            {[['supplier', 'Đánh giá cửa hàng'], ['product', 'Đánh giá sản phẩm']].map(([v, l]) => (
              <button key={v} onClick={() => switchTab(v)} className={`rounded-xl px-4 py-2 text-sm ${tab === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>{l}</button>
            ))}
          </div>
          {tab === 'product' && (
            products.length ? (
              <select value={targetId ?? ''} onChange={(e) => { setProductId(e.target.value); setSize(PAGE_SIZE); }} className="select select-bordered select-sm max-w-xs" aria-label="Chọn sản phẩm">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : <span className="text-sm text-base-content/55">Bạn chưa có sản phẩm nào.</span>
          )}
        </div>
      )}

      {meLoading ? (
        <div className="skeleton h-48 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <section className="h-fit rounded-2xl border border-base-300 bg-base-100 p-5 text-center shadow-sm lg:sticky lg:top-24">
            <p className="font-display text-5xl text-primary">{count ? summary.average.toFixed(1) : '—'}</p>
            <Stars value={count ? summary.average : 0} size={18} />
            <p className="mt-1 text-sm text-base-content/55">{count} đánh giá</p>
            {count > 0 && (
              <>
                <ul className="mt-4 flex flex-col gap-2 text-left">
                  {distribution.map((d) => (
                    <li key={d.star} className="flex items-center gap-2 text-xs">
                      <span className="flex w-8 items-center gap-0.5 text-base-content/60">{d.star}<Star width={11} height={11} className="text-warning" /></span>
                      <progress className="progress progress-warning flex-1" value={d.count} max={Math.max(reviews.length, 1)} />
                      <span className="w-8 text-right text-base-content/50">{d.count}</span>
                    </li>
                  ))}
                </ul>
                {reviews.length < count && <p className="mt-2 text-xs text-base-content/45">Phân bố tính trên {reviews.length} đánh giá mới nhất</p>}
              </>
            )}
          </section>

          <section className="flex flex-col gap-3">
            {noTarget ? (
              <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center text-base-content/55">Chưa có sản phẩm để xem đánh giá.</p>
            ) : isLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
            ) : isError ? (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-6 text-center">
                <p className="text-error">Không tải được đánh giá.</p>
                <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-2">Thử lại</button>
              </div>
            ) : !reviews.length ? (
              <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center text-base-content/55">Chưa có đánh giá nào.</p>
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-base-200 text-sm font-medium text-primary">
                        {(r.userName ?? '?').trim().split(/\s+/).slice(-1)[0][0]?.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{r.userName}</p>
                        <Stars value={r.rating} size={13} />
                      </div>
                    </div>
                    <time className="text-xs text-base-content/45">{formatDate(r.createdAt)}</time>
                  </div>
                  {r.comment ? <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-base-content/75">{r.comment}</p> : <p className="mt-2.5 text-xs italic text-base-content/45">Không có nhận xét</p>}
                </article>
              ))
            )}
            {!noTarget && reviews.length < totalLoaded && (
              <button onClick={() => setSize((s) => s + PAGE_SIZE)} className="btn btn-ghost btn-sm self-center">Xem thêm</button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
