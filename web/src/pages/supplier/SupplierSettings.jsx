import { useState } from 'react';
import { MANUFACTURER } from '../../api/mock/manufacturerData.js';
import { Briefcase, Gear, CreditCard, Bell, Shield, Store, Users, Phone, Mail, Calendar } from '../../components/suppliers/icons.jsx';

const TABS = [
  { key: 'profile', label: 'Hồ sơ doanh nghiệp', icon: Briefcase },
  { key: 'operations', label: 'Vận hành', icon: Gear },
  { key: 'payment', label: 'Thanh toán', icon: CreditCard },
  { key: 'notifications', label: 'Thông báo', icon: Bell },
  { key: 'security', label: 'Bảo mật', icon: Shield },
];

export default function SupplierSettings() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="font-display text-3xl">Cài đặt</h1>
        <p className="mt-1 text-base-content/60">Quản lý thông tin doanh nghiệp và cấu hình vận hành của bạn.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_320px]">
        {/* Inner tabs */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
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

        {/* Content */}
        <div className="flex flex-col gap-6">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'operations' && <OperationsTab />}
          {tab === 'payment' && <PaymentTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'security' && <SecurityTab />}

          <div className="flex justify-end gap-3">
            <button className="btn btn-ghost">Hủy</button>
            <button className="btn btn-primary">Lưu thay đổi</button>
          </div>
        </div>

        {/* Preview */}
        <PreviewCard />
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-4 font-display text-lg">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm text-base-content/70">{label}</span>{children}
    </label>
  );
}
function Toggle({ label, defaultChecked }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="toggle toggle-primary toggle-sm" />
    </label>
  );
}

function ProfileTab() {
  return (
    <Card title="Thông tin doanh nghiệp">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tên doanh nghiệp"><input defaultValue={MANUFACTURER.name} className="input input-bordered w-full" /></Field>
        <Field label="Email"><input defaultValue={MANUFACTURER.email} className="input input-bordered w-full" /></Field>
        <Field label="Hotline"><input defaultValue={MANUFACTURER.hotline} className="input input-bordered w-full" /></Field>
        <Field label="Mã số thuế"><input defaultValue={MANUFACTURER.taxCode} className="input input-bordered w-full" /></Field>
        <Field label="Địa chỉ trụ sở"><input defaultValue={MANUFACTURER.hqAddress} className="input input-bordered w-full" /></Field>
        <Field label="Mô tả ngắn" full><textarea defaultValue={MANUFACTURER.description} rows={3} className="textarea textarea-bordered w-full" /></Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div>
          <p className="mb-1.5 text-sm text-base-content/70">Ảnh logo</p>
          <div className="flex items-center gap-3">
            <span className="grid h-16 w-16 place-items-center rounded-xl bg-base-200 font-display text-xl text-primary">{MANUFACTURER.initials}</span>
            <button className="btn btn-outline btn-sm">Thay đổi</button>
          </div>
        </div>
        <div className="flex-1">
          <p className="mb-1.5 text-sm text-base-content/70">Ảnh bìa</p>
          <div className="flex items-center gap-3">
            <div className="h-16 flex-1 rounded-xl bg-[linear-gradient(135deg,#cdab7e,#9a6f47)]" />
            <button className="btn btn-outline btn-sm">Thay đổi</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OperationsTab() {
  return (
    <Card title="Thiết lập vận hành">
      <div className="divide-y divide-base-200">
        <Toggle label="Tự động phân đơn cho chi nhánh gần nhất" defaultChecked />
        <Toggle label="Hiển thị sản phẩm hết hàng trên cửa hàng" />
        <Toggle label="Cho phép đồng bộ tồn kho giữa các chi nhánh" defaultChecked />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Thời gian xử lý đơn mặc định">
          <select className="select select-bordered w-full" defaultValue="24"><option value="12">12 giờ</option><option value="24">24 giờ</option><option value="48">48 giờ</option></select>
        </Field>
        <Field label="Chi nhánh mặc định nhận đơn online">
          <select className="select select-bordered w-full"><option>Chi nhánh Tân Bình</option><option>Chi nhánh Quận 1</option></select>
        </Field>
        <Field label="Chính sách đổi trả mặc định" full>
          <select className="select select-bordered w-full"><option>Đổi trả trong 7 ngày</option><option>Đổi trả trong 14 ngày</option><option>Không hỗ trợ đổi trả</option></select>
        </Field>
      </div>
    </Card>
  );
}

function PaymentTab() {
  return (
    <Card title="Thông tin thanh toán">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ngân hàng"><input defaultValue="ACB - Ngân hàng Á Châu" className="input input-bordered w-full" /></Field>
        <Field label="Chủ tài khoản"><input defaultValue="CONG TY NOI THAT AN PHAT" className="input input-bordered w-full" /></Field>
        <Field label="Số tài khoản"><input defaultValue="•••• •••• 6789" className="input input-bordered w-full" /></Field>
        <Field label="Chi nhánh ngân hàng"><input defaultValue="ACB Thủ Đức" className="input input-bordered w-full" /></Field>
        <Field label="Phương thức nhận tiền"><select className="select select-bordered w-full"><option>Chuyển khoản ngân hàng</option><option>Ví điện tử</option></select></Field>
        <Field label="Chu kỳ đối soát"><select className="select select-bordered w-full"><option>Hàng tuần</option><option>Hàng tháng</option></select></Field>
      </div>
    </Card>
  );
}

function NotificationsTab() {
  return (
    <Card title="Thông báo">
      <div className="divide-y divide-base-200">
        <Toggle label="Nhận email khi có đơn hàng mới" defaultChecked />
        <Toggle label="Nhận thông báo khi có đánh giá mới" defaultChecked />
        <Toggle label="Nhận cảnh báo sản phẩm sắp hết hàng" defaultChecked />
        <Toggle label="Báo cáo tổng hợp hằng tuần" />
        <Toggle label="Nhận thông báo trên trình duyệt" defaultChecked />
      </div>
    </Card>
  );
}

function SecurityTab() {
  return (
    <Card title="Bảo mật">
      <div className="flex flex-col divide-y divide-base-200">
        <div className="flex items-center justify-between gap-3 py-3">
          <div><p className="text-sm font-medium">Đổi mật khẩu</p><p className="text-xs text-base-content/55">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.</p></div>
          <button className="btn btn-outline btn-sm">Đổi mật khẩu</button>
        </div>
        <Toggle label="Xác thực 2 lớp (2FA)" />
        <div className="flex items-center justify-between gap-3 py-3">
          <div><p className="text-sm font-medium">Quản lý thiết bị đăng nhập</p><p className="text-xs text-base-content/55">2 thiết bị đang hoạt động.</p></div>
          <button className="btn btn-outline btn-sm">Xem</button>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div><p className="text-sm font-medium">Lịch sử hoạt động gần đây</p><p className="text-xs text-base-content/55">Đăng nhập gần nhất: hôm nay, 09:12.</p></div>
          <button className="btn btn-outline btn-sm">Xem</button>
        </div>
      </div>
    </Card>
  );
}

function PreviewCard() {
  const rows = [
    { icon: Store, label: 'Số chi nhánh', value: MANUFACTURER.branchCount },
    { icon: Users, label: 'Liên hệ chính', value: MANUFACTURER.contactName },
    { icon: Phone, label: 'SĐT', value: MANUFACTURER.hotline },
    { icon: Mail, label: 'Email', value: MANUFACTURER.email },
    { icon: CreditCard, label: 'Tài khoản nhận thanh toán', value: MANUFACTURER.bank },
    { icon: CreditCard, label: 'Số đuôi tài khoản', value: `•••• ${MANUFACTURER.accountTail}` },
    { icon: Calendar, label: 'Ngày tham gia', value: MANUFACTURER.joinDate },
  ];
  return (
    <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-4 font-display text-lg">Tổng quan doanh nghiệp</h2>
      <div className="flex flex-col items-center text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary font-display text-2xl text-primary-content">{MANUFACTURER.initials}</span>
        <p className="mt-3 font-display text-lg">{MANUFACTURER.name}</p>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Đang hoạt động</span>
      </div>
      <dl className="mt-5 flex flex-col divide-y divide-base-200">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="flex items-center gap-2 text-xs text-base-content/55"><r.icon width={14} height={14} className="text-base-content/40" />{r.label}</dt>
            <dd className="text-right text-sm font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
