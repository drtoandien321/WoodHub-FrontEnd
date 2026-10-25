import { useSearchParams } from 'react-router-dom';
import { Briefcase, Shield, Wallet, Bell, Tool } from '../suppliers/icons.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import SupplierProfileForm from './SupplierProfileForm.jsx';
import ChangePasswordCard from './ChangePasswordCard.jsx';
import SupplierOverviewCard from './SupplierOverviewCard.jsx';
import PayoutSettingsCard from './PayoutSettingsCard.jsx';
import CapabilitySettingsCard from './CapabilitySettingsCard.jsx';
import NotificationSettingsCard from '../settings/NotificationSettingsCard.jsx';

/*
 * Trang Cài đặt dùng chung cho portal NCC & xưởng:
 *   - Hồ sơ: PATCH /suppliers/me + logo / ảnh bìa (BE-10)
 *   - Nhận tiền: /suppliers/me/payout (BE-14 §1)
 *   - Thông báo: bật/tắt email theo loại (BE-14 §2)
 *   - Năng lực gia công: chỉ xưởng (BE-10 §3)
 *   - Bảo mật: đổi mật khẩu
 * Tab đọc từ ?tab= để link "tắt email" trong email (/settings/notifications) mở thẳng đúng tab.
 * Tab Vận hành và 2FA / thiết bị đăng nhập BE chưa làm → chưa hiện.
 */
export default function PortalSettings({ subtitle, profileTabLabel, nameLabel, descriptionLabel, overviewTitle }) {
  const isWorkshop = useAuthStore((s) => s.user?.supplierType) === 'workshop';
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = [
    { key: 'profile', label: profileTabLabel, icon: Briefcase },
    ...(isWorkshop ? [{ key: 'capability', label: 'Năng lực gia công', icon: Tool }] : []),
    { key: 'payout', label: 'Nhận tiền', icon: Wallet },
    { key: 'notifications', label: 'Thông báo', icon: Bell },
    { key: 'security', label: 'Bảo mật', icon: Shield },
  ];
  const requested = searchParams.get('tab');
  const tab = tabs.some((x) => x.key === requested) ? requested : 'profile';
  const setTab = (key) => setSearchParams(key === 'profile' ? {} : { tab: key }, { replace: true });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Cài đặt</h1>
        <p className="mt-1 text-base-content/70">{subtitle}</p>
      </header>

      {/* 3 cột chỉ từ 2xl (≥1536px): ở laptop 1280–1440px, sidebar portal + menu tab + thẻ tổng quan chiếm hết → cột form
          còn ~250px, ô nhập bị cắt chữ. Màn lg–xl: 2 cột, thẻ tổng quan xuống dưới form (cột 2). */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] 2xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <nav className="flex gap-2 overflow-x-auto lg:row-span-2 lg:flex-col lg:self-start lg:overflow-visible 2xl:row-span-1">
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
          {tab === 'capability' && <CapabilitySettingsCard />}
          {tab === 'payout' && <PayoutSettingsCard />}
          {tab === 'notifications' && <NotificationSettingsCard />}
          {tab === 'security' && <ChangePasswordCard />}
        </div>

        <div className="lg:col-start-2 2xl:col-start-auto">
          <SupplierOverviewCard title={overviewTitle} />
        </div>
      </div>
    </div>
  );
}
