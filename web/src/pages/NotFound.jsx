import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <h1 className="font-display text-6xl text-primary">404</h1>
      <p className="text-base-content/70">Trang này chưa được đóng (hoặc không tồn tại).</p>
      <Link to="/" className="btn btn-primary btn-sm mt-2">Về trang chủ</Link>
    </div>
  );
}
