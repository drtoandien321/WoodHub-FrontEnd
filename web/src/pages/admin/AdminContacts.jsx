import { useState } from 'react';
import { useAdminContacts, useUpdateContactStatus } from '../../hooks/useAdminOps.js';
import { formatDate } from '../../utils/format.js';
import Pagination from '../../components/ui/Pagination.jsx';

const PAGE_SIZE = 20;
const TABS = [['new', 'Mới'], ['handled', 'Đã xử lý'], ['spam', 'Spam'], ['', 'Tất cả']];
const STATUS_BADGE = { new: 'bg-info/15 text-info', handled: 'bg-success/15 text-success', spam: 'bg-base-300/60 text-base-content/70' };
const STATUS_LABEL = { new: 'Mới', handled: 'Đã xử lý', spam: 'Spam' };

/*
 * AdminContacts — liên hệ khách gửi từ form /contact (BE-06): GET /admin/contacts (tab theo trạng thái + tìm theo tên /
 * email / tiêu đề), PATCH đổi trạng thái new | handled | spam (đánh dấu spam thay vì xoá).
 * Trả lời khách: bấm "Trả lời qua email" (mailto) — BE không gửi mail xác nhận cho khách.
 */
export default function AdminContacts() {
  const [status, setStatus] = useState('new');
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(null);
  const { data, isLoading, isError, refetch } = useAdminContacts({ status: status || undefined, keyword: query || undefined, page, size: PAGE_SIZE });
  const update = useUpdateContactStatus();
  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Liên hệ</h1>
        <p className="mt-1 text-base-content/70">Tin nhắn khách gửi từ trang Liên hệ. Trả lời qua email rồi đánh dấu đã xử lý.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {TABS.map(([v, l]) => (
            <button key={v || 'all'} onClick={() => { setStatus(v); setPage(0); }} className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm ${status === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>
              {l}{v === 'new' && status === 'new' && pageInfo.totalElements > 0 && <span className="badge badge-sm">{pageInfo.totalElements}</span>}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(keyword.trim()); setPage(0); }} className="flex gap-2">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tên, email, tiêu đề…" className="input input-bordered input-sm" />
          <button className="btn btn-outline btn-sm">Tìm</button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : isError ? (
        <p className="text-center text-error">Không tải được liên hệ. <button onClick={() => refetch()} className="link">Thử lại</button></p>
      ) : !items.length ? (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-12 text-center text-base-content/70">Không có liên hệ nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
              <button type="button" onClick={() => setOpen(open === c.id ? null : c.id)} className="flex w-full flex-wrap items-start justify-between gap-3 text-left">
                <span className="min-w-0">
                  <span className="block font-medium">{c.subject}</span>
                  <span className="block text-xs text-base-content/70">{c.name} · {c.email}{c.phone ? ` · ${c.phone}` : ''} · {formatDate(c.createdAt)}</span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? ''}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
              </button>
              {open === c.id && (
                <div className="mt-3 flex flex-col gap-3 border-t border-base-200 pt-3">
                  <p className="whitespace-pre-line text-sm text-base-content/80">{c.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}`} className="btn btn-primary btn-sm">Trả lời qua email</a>
                    {['handled', 'new', 'spam'].filter((s) => s !== c.status).map((s) => (
                      <button key={s} onClick={() => update.mutate({ id: c.id, status: s })} disabled={update.isPending} className="btn btn-outline btn-sm">
                        {s === 'handled' ? 'Đánh dấu đã xử lý' : s === 'spam' ? 'Đánh dấu spam' : 'Mở lại'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination pageInfo={pageInfo} onChange={setPage} />
    </div>
  );
}
