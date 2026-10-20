import { useState } from 'react';
import { Briefcase, Shield } from '../suppliers/icons.jsx';
import SupplierProfileForm from './SupplierProfileForm.jsx';
import ChangePasswordCard from './ChangePasswordCard.jsx';
import SupplierOverviewCard from './SupplierOverviewCard.jsx';

/*
 * Trang Cài đặt dùng chung cho portal NCC & xưởng. Chỉ giữ những gì BE đã có API:
 *   - Hồ sơ: PUT /suppliers/me · Bảo mật: đổi mật khẩu (PUT /users/{id}/password).
 * Bản mock cũ còn tab Vận hành / Thanh toán / Thông báo / Năng lực + 2FA, thiết bị đăng nhập — toàn
 * nút không làm gì (BE chưa có bảng/endpoint) → gỡ khỏi UI, liệt kê trong docs/BE_MISSING.md để BE làm.
 */
export default function PortalSettings({ subtitle, profileTabLabel, nameLabel, descriptionLabel, overviewTitle }) {
  const [tab, setTab] = useState('profile');
  const tabs = [
    { key: 'profile', label: profileTabLabel, icon: Briefcase },
    { key: 'security', label: 'Bảo mật', icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Cài đặt</h1>
        <p className="mt-1 text-base-content/60">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                tab === t.key ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}
            >
              <t.icon width={16} height={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          {tab === 'profile' && <SupplierProfileForm nameLabel={nameLabel} descriptionLabel={descriptionLabel} />}
          {tab === 'security' && <ChangePasswordCard />}
        </div>

        <SupplierOverviewCard title={overviewTitle} />
      </div>
    </div>
  );
}
