import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/analytics.js';

/*
 * Gửi page_view mỗi lần đổi route (SPA). Bỏ qua khu vực nội bộ (/admin, /portal) để số liệu
 * chỉ phản ánh khách thật, không lẫn thao tác của team. `last` chặn gửi trùng (React.StrictMode
 * ở dev chạy effect 2 lần).
 */
const INTERNAL = /^\/(admin|portal)(\/|$)/;

export default function AnalyticsTracker() {
  const { pathname, search } = useLocation();
  const last = useRef('');

  useEffect(() => {
    if (INTERNAL.test(pathname)) return;
    const full = pathname + search;
    if (last.current === full) return;
    last.current = full;
    trackPageView(full);
  }, [pathname, search]);

  return null;
}
