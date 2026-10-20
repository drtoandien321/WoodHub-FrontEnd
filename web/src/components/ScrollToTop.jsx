import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/*
 * Cuộn lên đầu trang mỗi khi đổi route — React Router không tự làm việc này.
 * Sửa lỗi: bấm link ở Footer (cuối trang Landing) sang /about thì trình duyệt giữ
 * nguyên vị trí cuộn cũ → rơi vào giữa trang (mục Bảng giá). Giờ luôn về đầu trang.
 * Trừ link có #anchor (vd /profile#business): trang đích tự cuộn tới anchor, không kéo về đầu trang.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
}
