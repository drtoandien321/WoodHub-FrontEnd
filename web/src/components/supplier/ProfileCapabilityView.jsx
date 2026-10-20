import { Link } from 'react-router-dom';
import { Pencil } from '../suppliers/icons.jsx';
import { useSupplierMe, usePortalBrand } from '../../hooks/useSupplierMe.js';
import { useAuthStore } from '../../stores/authStore.js';
import PortfolioManager from './PortfolioManager.jsx';

/*
 * ProfileCapabilityView — trang "Hồ sơ & Portfolio" dùng chung (NCC & xưởng), dữ liệu THẬT:
 *   - Tên + mô tả: GET /suppliers/me (sửa ở trang Cài đặt — nút "Chỉnh sửa" dẫn sang đó).
 *   - Portfolio: CRUD /suppliers/me/portfolio (PortfolioManager).
 * Bản cũ lấy cứng từ file mock cả ảnh bìa, "điểm mạnh", "năng lực", "chứng nhận" và 2 nút không chạy.
 * BE chưa có các trường đó → bỏ khỏi UI (đã ghi vào docs/BE_MISSING.md).
 */
export default function ProfileCapabilityView({ subtitle, settingsPath, allowProducts }) {
  const { data, isLoading } = useSupplierMe();
  const brand = usePortalBrand(useAuthStore((s) => s.user?.name));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Hồ sơ &amp; Portfolio</h1>
        <p className="mt-1 text-base-content/60">{subtitle}</p>
      </header>

      <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{brand.name}</h2>
          <Link to={settingsPath} className="btn btn-outline btn-sm gap-2"><Pencil width={15} height={15} /> Chỉnh sửa</Link>
        </div>
        {isLoading ? (
          <div className="skeleton mt-3 h-12 w-full max-w-3xl" />
        ) : data?.description ? (
          <p className="mt-2 max-w-3xl whitespace-pre-line leading-relaxed text-base-content/75">{data.description}</p>
        ) : (
          <p className="mt-2 text-sm text-base-content/50">
            Chưa có phần giới thiệu. <Link to={settingsPath} className="text-primary hover:underline">Thêm mô tả</Link> để khách hiểu hơn về bạn.
          </p>
        )}
      </section>

      <PortfolioManager allowProducts={allowProducts} />
    </div>
  );
}
