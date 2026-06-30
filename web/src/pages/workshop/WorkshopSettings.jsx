import { useState } from 'react';
import { WORKSHOP, W_PROFILE } from '../../api/mock/workshopPortalData.js';
import { Briefcase, Layers, Bell, Shield, Users, Phone, Mail, Calendar, MapPin } from '../../components/suppliers/icons.jsx';

const TABS = [
  { key: 'profile', label: 'Hồ sơ xưởng', icon: Briefcase },
  { key: 'capability', label: 'Năng lực', icon: Layers },
  { key: 'notifications', label: 'Thông báo', icon: Bell },
  { key: 'security', label: 'Bảo mật', icon: Shield },
];

export default function WorkshopSettings() {
  const [tab, setTab] = useState('profile');
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="font-display text-3xl">Cài đặt</h1>
        <p className="mt-1 text-base-content/60">Quản lý hồ sơ xưởng, năng lực gia công và cấu hình tài khoản.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_320px]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${tab === t.key ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>
              <t.icon width={16} height={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-6">
          {tab === 'profile' && (
            <Card title="Hồ sơ xưởng">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tên xưởng"><input defaultValue={WORKSHOP.name} className="input input-bordered w-full" /></Field>
                <Field label="Email"><input defaultValue={WORKSHOP.email} className="input input-bordered w-full" /></Field>
                <Field label="Hotline"><input defaultValue={WORKSHOP.hotline} className="input input-bordered w-full" /></Field>
                <Field label="Người liên hệ"><input defaultValue={WORKSHOP.contactName} className="input input-bordered w-full" /></Field>
                <Field label="Địa chỉ xưởng" full><input defaultValue={WORKSHOP.address} className="input input-bordered w-full" /></Field>
                <Field label="Giới thiệu" full><textarea defaultValue={WORKSHOP.description} rows={3} className="textarea textarea-bordered w-full" /></Field>
              </div>
            </Card>
          )}

          {tab === 'capability' && (
            <Card title="Năng lực gia công">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {W_PROFILE.capabilities.map((c) => (
                  <Field key={c.label} label={c.label}><input defaultValue={c.value} className="input input-bordered w-full" /></Field>
                ))}
              </div>
              <p className="mt-3 text-xs text-base-content/50">Năng lực hiển thị ở hồ sơ công khai (/suppliers) để khách chọn đặt custom.</p>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card title="Thông báo">
              <div className="divide-y divide-base-200">
                {['Nhận email khi có đơn custom mới', 'Nhận thông báo khi khách chốt báo giá', 'Nhắc cập nhật tiến độ sản xuất', 'Nhận thông báo khi có đánh giá mới'].map((l, i) => (
                  <label key={l} className="flex items-center justify-between gap-3 py-2.5"><span className="text-sm">{l}</span><input type="checkbox" defaultChecked={i < 3} className="toggle toggle-primary toggle-sm" /></label>
                ))}
              </div>
            </Card>
          )}

          {tab === 'security' && (
            <Card title="Bảo mật">
              <div className="flex flex-col divide-y divide-base-200">
                <Row title="Đổi mật khẩu" desc="Cập nhật mật khẩu định kỳ." action="Đổi mật khẩu" />
                <label className="flex items-center justify-between gap-3 py-3"><span className="text-sm">Xác thực 2 lớp (2FA)</span><input type="checkbox" className="toggle toggle-primary toggle-sm" /></label>
                <Row title="Lịch sử đăng nhập" desc="Đăng nhập gần nhất: hôm nay." action="Xem" />
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-3"><button className="btn btn-ghost">Hủy</button><button className="btn btn-primary">Lưu thay đổi</button></div>
        </div>

        <aside className="h-fit rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-4 font-display text-lg">Tổng quan xưởng</h2>
          <div className="flex flex-col items-center text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary font-display text-2xl text-primary-content">{WORKSHOP.initials}</span>
            <p className="mt-3 font-display text-lg">{WORKSHOP.name}</p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Đang hoạt động</span>
          </div>
          <dl className="mt-5 flex flex-col divide-y divide-base-200">
            {[
              { icon: Users, label: 'Người liên hệ', value: WORKSHOP.contactName },
              { icon: Phone, label: 'SĐT', value: WORKSHOP.hotline },
              { icon: Mail, label: 'Email', value: WORKSHOP.email },
              { icon: MapPin, label: 'Địa chỉ', value: WORKSHOP.address },
              { icon: Calendar, label: 'Tham gia', value: WORKSHOP.joinDate },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2 text-xs text-base-content/55"><r.icon width={14} height={14} className="text-base-content/40" />{r.label}</dt>
                <dd className="max-w-[170px] truncate text-right text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"><h2 className="mb-4 font-display text-lg">{title}</h2>{children}</section>;
}
function Field({ label, children, full }) {
  return <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}><span className="text-sm text-base-content/70">{label}</span>{children}</label>;
}
function Row({ title, desc, action }) {
  return <div className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-base-content/55">{desc}</p></div><button className="btn btn-outline btn-sm">{action}</button></div>;
}
