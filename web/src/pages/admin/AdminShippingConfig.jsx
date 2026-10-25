import { useEffect, useState } from 'react';
import { useShippingConfig, useUpdateShippingConfig } from '../../hooks/usePromotions.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import { apiErrorMessage } from '../../utils/apiError.js';

/*
 * Công thức BE áp khi checkout (docs/promotions-admin-fe.md — PHẦN B):
 *   fee = baseFee + perKmFee * max(0, distanceKm - freeRadiusKm)
 *   fee = 0                 nếu subtotal >= freeShipThreshold (null = tắt)
 *   fee = min(fee, maxFeeCap)                                  (null = không trần)
 * Chỉ dùng để XEM TRƯỚC ở FE; tiền ship thật luôn do BE tính.
 */
const previewFee = (c, distanceKm, subtotal) => {
  if (c.freeShipThreshold != null && subtotal >= c.freeShipThreshold) return 0;
  const fee = c.baseFee + c.perKmFee * Math.max(0, distanceKm - c.freeRadiusKm);
  return Math.round(c.maxFeeCap != null ? Math.min(fee, c.maxFeeCap) : fee);
};

const toForm = (cfg) => ({
  baseFee: String(cfg.baseFee ?? ''), perKmFee: String(cfg.perKmFee ?? ''), freeRadiusKm: String(cfg.freeRadiusKm ?? ''),
  freeShipThreshold: cfg.freeShipThreshold == null ? '' : String(cfg.freeShipThreshold),
  maxFeeCap: cfg.maxFeeCap == null ? '' : String(cfg.maxFeeCap),
  useThreshold: cfg.freeShipThreshold != null, useCap: cfg.maxFeeCap != null,
});

/*
 * AdminShippingConfig (/admin/shipping-config) — cấu hình phí ship TOÀN SÀN (GET/PUT /api/admin/shipping-config).
 * 2 field có thể "tắt" (ngưỡng miễn ship, trần phí) → dùng công tắc thay vì để ô trống mơ hồ:
 * tắt = gửi null cho BE.
 */
export default function AdminShippingConfig() {
  const { data: cfg, isLoading, isError, refetch } = useShippingConfig();
  const update = useUpdateShippingConfig();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
  const [sample, setSample] = useState({ km: '5', subtotal: '1500000' });

  // Nạp form khi có dữ liệu BE (và sau mỗi lần lưu thành công — cache được ghi bằng response mới)
  useEffect(() => { if (cfg) setForm(toForm(cfg)); }, [cfg]);

  if (isLoading || (!form && !isError)) return <div className="skeleton h-96 rounded-2xl" />;
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-error">Không tải được cấu hình phí ship.</p>
        <button onClick={() => refetch()} className="btn btn-outline btn-sm">Thử lại</button>
      </div>
    );
  }

  const set = (k) => (e) => { setForm((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); setMsg(null); };
  const num = (v) => (v === '' ? NaN : Number(v));

  // Body đúng ShippingConfigRequest; công tắc tắt → null
  const body = {
    baseFee: num(form.baseFee), perKmFee: num(form.perKmFee), freeRadiusKm: num(form.freeRadiusKm),
    freeShipThreshold: form.useThreshold ? num(form.freeShipThreshold) : null,
    maxFeeCap: form.useCap ? num(form.maxFeeCap) : null,
  };
  const validate = () => {
    const e = {};
    ['baseFee', 'perKmFee', 'freeRadiusKm'].forEach((k) => { if (!(body[k] >= 0)) e[k] = 'Nhập số ≥ 0'; });
    if (form.useThreshold && !(body.freeShipThreshold >= 0)) e.freeShipThreshold = 'Nhập số ≥ 0';
    if (form.useCap && !(body.maxFeeCap >= 0)) e.maxFeeCap = 'Nhập số ≥ 0';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const save = () => {
    if (!validate()) return;
    update.mutate(body, {
      onSuccess: () => setMsg({ type: 'success', text: 'Đã lưu. Cấu hình mới áp dụng cho các đơn đặt từ bây giờ.' }),
      onError: (err) => setMsg({ type: 'error', text: apiErrorMessage(err, 'Lưu thất bại, vui lòng thử lại.') }),
    });
  };

  const valid = ['baseFee', 'perKmFee', 'freeRadiusKm'].every((k) => body[k] >= 0);
  const fee = valid ? previewFee(body, Number(sample.km) || 0, Number(sample.subtotal) || 0) : null;

  const numberField = (k, label, suffix, hint) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-base-content/70">{label}</span>
      <div className="join w-full">
        <input type="number" min="0" value={form[k]} onChange={set(k)} className={`input input-bordered join-item w-full ${errors[k] ? 'input-error' : ''}`} />
        <span className="join-item flex items-center border border-base-300 bg-base-200 px-3 text-sm text-base-content/70">{suffix}</span>
      </div>
      {errors[k] ? <span className="text-xs text-error">{errors[k]}</span> : hint && <span className="text-xs text-base-content/70">{hint}</span>}
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Phí vận chuyển</h1>
        <p className="mt-1 text-base-content/70">Áp dụng cho mọi đơn B2C. Khoảng cách tính từ chi nhánh gần khách nhất của từng nhà cung cấp.</p>
      </header>

      <div className="@container"><div className="grid items-start gap-6 @4xl:grid-cols-[1fr_320px]">
        <section className="@container flex flex-col gap-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="grid gap-4 @xl:grid-cols-3">
            {numberField('baseFee', 'Phí cơ bản', 'đ', 'Mọi đơn đều tính')}
            {numberField('perKmFee', 'Phí mỗi km', 'đ/km', 'Ngoài bán kính miễn phí')}
            {numberField('freeRadiusKm', 'Bán kính miễn phí', 'km', 'Trong bán kính chỉ tính phí cơ bản')}
          </div>

          <div className="grid gap-4 @lg:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-base-300 p-3">
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
                Miễn ship theo giá trị đơn
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={form.useThreshold} onChange={set('useThreshold')} />
              </label>
              {form.useThreshold && numberField('freeShipThreshold', 'Miễn ship khi tiền hàng từ', 'đ')}
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-base-300 p-3">
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
                Giới hạn phí tối đa
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={form.useCap} onChange={set('useCap')} />
              </label>
              {form.useCap && numberField('maxFeeCap', 'Phí ship tối đa', 'đ')}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-200 pt-4">
            <p className="text-xs text-base-content/70">{cfg?.updatedAt && `Cập nhật lần cuối: ${formatDate(cfg.updatedAt)}`}</p>
            <div className="flex gap-2">
              <button onClick={() => { setForm(toForm(cfg)); setErrors({}); setMsg(null); }} disabled={update.isPending} className="btn btn-ghost">Hoàn tác</button>
              <button onClick={save} disabled={update.isPending} className="btn btn-primary">
                {update.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
          {msg && <div role={msg.type === 'error' ? 'alert' : 'status'} className={`alert py-2 text-sm ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>{msg.text}</div>}
        </section>

        {/* Tính thử theo cấu hình ĐANG NHẬP (chưa cần lưu) */}
        <aside className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm @4xl:sticky @4xl:top-24">
          <h2 className="font-display text-lg">Tính thử</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-base-content/70">Khoảng cách (km)</span>
            <input type="number" min="0" step="0.1" value={sample.km} onChange={(e) => setSample((s) => ({ ...s, km: e.target.value }))} className="input input-bordered input-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-base-content/70">Tiền hàng của đơn (đ)</span>
            <input type="number" min="0" value={sample.subtotal} onChange={(e) => setSample((s) => ({ ...s, subtotal: e.target.value }))} className="input input-bordered input-sm" />
          </label>
          <div className="flex items-baseline justify-between rounded-xl bg-base-200/60 px-4 py-3">
            <span className="text-sm">Phí ship</span>
            <span className="text-xl font-semibold text-primary">{fee == null ? '—' : fee === 0 ? 'Miễn phí' : formatVnd(fee)}</span>
          </div>
          <p className="text-xs text-base-content/70">Xem trước theo số đang nhập. Phí thật do hệ thống tính lúc khách đặt hàng.</p>
        </aside>
      </div></div>
    </div>
  );
}
