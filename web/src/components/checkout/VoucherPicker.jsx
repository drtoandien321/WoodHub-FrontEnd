import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatVnd, formatDate } from '../../utils/format.js';
import { translateErrorCode } from '../../utils/apiError.js';
import { Tag, Truck, Check } from '../suppliers/icons.jsx';

/*
 * VoucherPicker — chọn voucher kiểu Shopee ở Checkout (GET /vouchers/available), thay ô nhập mã tay đã bị BE bỏ.
 *
 * - BE trả sẵn thứ tự: gợi ý → dùng được (giảm nhiều trước) → chưa dùng được. FE giữ nguyên thứ tự đó.
 * - Voucher chưa dùng được (eligible=false) bị làm mờ + hiện lý do; không tick được.
 * - Luật "mỗi đơn tối đa 1 voucher sản phẩm + 1 voucher ship": tick 1 voucher sẽ bỏ tick voucher CÙNG LOẠI và CÙNG
 *   PHẠM VI (cùng shop, hoặc cùng là voucher sàn) — xem groupKey. Trường hợp chồng chéo còn lại (vd voucher sàn + voucher
 *   shop cùng nhắm 1 đơn) để BE quyết định lúc đặt hàng, đúng như docs BE ghi.
 *
 * Props: vouchers (mảng VoucherResponse), selectedIds (string[]), onChange(ids), hasAddress (đã chọn địa chỉ có toạ độ).
 */
const PREVIEW_COUNT = 4;

export const voucherGroupKey = (v) => `${v.type}:${v.scope === 'shop' ? v.supplierId : 'platform'}`;

export default function VoucherPicker({ vouchers, selectedIds, onChange, hasAddress }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isVi = (i18n.resolvedLanguage ?? i18n.language ?? '').startsWith('vi');

  // Giao diện VI: câu BE viết sẵn (đã có số tiền cụ thể). EN: dịch theo reasonCode + reasonParams.
  const reasonText = (v) => (isVi ? v.reason : translateErrorCode(v.reasonCode, v.reasonParams) ?? v.reason);

  const toggle = (v) => {
    if (selectedIds.includes(v.id)) {
      onChange(selectedIds.filter((id) => id !== v.id));
      return;
    }
    const key = voucherGroupKey(v);
    const sameGroup = new Set(vouchers.filter((x) => voucherGroupKey(x) === key).map((x) => x.id));
    onChange([...selectedIds.filter((id) => !sameGroup.has(id)), v.id]);
  };

  // Voucher đang chọn luôn hiện (kể cả khi nằm sau mốc "Xem thêm")
  const visible = expanded ? vouchers : vouchers.filter((v, i) => i < PREVIEW_COUNT || selectedIds.includes(v.id));
  const hidden = vouchers.length - visible.length;

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {visible.map((v) => {
          const checked = selectedIds.includes(v.id);
          const shipping = v.type === 'shipping';
          const Icon = shipping ? Truck : Tag;
          const meta = [
            v.minOrderAmount ? t('checkout.voucherMinOrder', { amount: formatVnd(v.minOrderAmount) }) : null,
            v.endsAt ? t('checkout.voucherEndsAt', { date: formatDate(v.endsAt) }) : null,
            v.remainingUses != null ? t('checkout.voucherRemaining', { count: v.remainingUses }) : null,
          ].filter(Boolean).join(' · ');
          return (
            <li key={v.id}>
              <label
                className={`flex gap-3 rounded-xl border p-3 transition-colors ${
                  !v.eligible ? 'cursor-not-allowed border-dashed border-base-300 opacity-60'
                  : checked ? 'cursor-pointer border-primary bg-primary/5' : 'cursor-pointer border-base-300 hover:border-primary/50'
                }`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${shipping ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
                  <Icon width={18} height={18} />
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{v.name}</span>
                    {v.recommended && v.eligible && <span className="badge badge-success badge-xs">{t('checkout.voucherRecommended')}</span>}
                    {shipping && <span className="badge badge-ghost badge-xs">{t('checkout.voucherShippingTag')}</span>}
                  </span>
                  <span className="block text-xs text-base-content/70">
                    {v.scope === 'shop' ? t('checkout.voucherShop', { shop: v.supplierName }) : t('checkout.voucherPlatform')}
                    {meta && ` · ${meta}`}
                  </span>
                  {v.eligible ? (
                    v.estimatedDiscount != null
                      ? <span className="mt-0.5 block text-xs font-medium text-success">{t('checkout.voucherSave', { amount: formatVnd(v.estimatedDiscount) })}</span>
                      : shipping && !hasAddress && <span className="mt-0.5 block text-xs text-base-content/70">{t('checkout.voucherShipNeedAddress')}</span>
                  ) : (
                    <span className="mt-0.5 block text-xs text-warning">{reasonText(v)}</span>
                  )}
                </span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm mt-0.5"
                  checked={checked}
                  disabled={!v.eligible}
                  onChange={() => toggle(v)}
                  aria-label={v.name}
                />
              </label>
            </li>
          );
        })}
      </ul>
      {(hidden > 0 || expanded) && vouchers.length > PREVIEW_COUNT && (
        <button type="button" onClick={() => setExpanded((x) => !x)} className="btn btn-ghost btn-xs self-start">
          {expanded ? t('checkout.showLessVouchers') : t('checkout.showMoreVouchers', { count: hidden })}
        </button>
      )}
      {selectedIds.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-base-content/70">
          <Check width={12} height={12} className="text-success" /> {t('checkout.voucherSelectedCount', { count: selectedIds.length })}
        </p>
      )}
    </div>
  );
}
