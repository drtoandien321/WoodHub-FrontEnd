import { useTranslation } from 'react-i18next';
import { RefreshCw, Shield, Truck } from '../suppliers/icons.jsx';

/*
 * ProductTrustCards — 3 thẻ cam kết CHUNG CỦA SÀN (giống nhau cho mọi SP nên để i18n tĩnh).
 * Chỉ ghi điều BE thật sự làm (QA BUG-008 — trước đây ghi "Bảo hành 24 tháng / Lắp đặt tận nơi / Giao 3–7 ngày"
 * mà DB không có dữ liệu nào như vậy):
 *  - payment : thanh toán QR chuyển khoản SePay, đơn tự cập nhật khi tiền vào
 *  - refund  : đơn đã thanh toán bị huỷ → hoàn tiền trong 48 giờ (OrderServiceImpl, mốc cancelled_at)
 *  - shipping: phí ship tính theo khoảng cách tới chi nhánh (orders.distance_km, /orders/preview)
 * Khi NCC tự khai bảo hành/lắp đặt (cần field BE) thì thêm thẻ theo dữ liệu, KHÔNG ghi cứng.
 */
const ITEMS = [
  { key: 'payment', Icon: Shield },
  { key: 'refund', Icon: RefreshCw },
  { key: 'shipping', Icon: Truck },
];

export default function ProductTrustCards() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {ITEMS.map(({ key, Icon }) => (
        <div key={key} className="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-100 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-base-200 text-primary">
            <Icon width={18} height={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">{t(`product.trust.${key}.title`)}</p>
            <p className="mt-0.5 text-xs text-base-content/70">{t(`product.trust.${key}.desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
